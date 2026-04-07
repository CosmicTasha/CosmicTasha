// Core auth functions — magic link + DB-backed sessions

import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { magicTokens } from '@/db/auth-schema';
import { eq, and, gt } from 'drizzle-orm';
import crypto, { createHash } from 'crypto';
import { lucia } from '@/lib/auth/lucia';

const SESSION_COOKIE = lucia.sessionCookieName;

// Hash a token using SHA-256 before storing/comparing
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Generate a magic link token (random, 15min expiry)
// Stores the SHA-256 hash in the DB; returns the plaintext token for the link.
export async function createMagicToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db.insert(magicTokens).values({
    email,
    token: hashedToken,
    expiresAt,
  });

  return token;
}

// Verify magic token and create session
export async function verifyMagicToken(
  token: string,
): Promise<{ userId: string; sessionId: string } | null> {
  const hashedToken = hashToken(token);

  const record = await db.query.magicTokens.findFirst({
    where: and(
      eq(magicTokens.token, hashedToken),
      eq(magicTokens.used, false),
      gt(magicTokens.expiresAt, new Date()),
    ),
  });

  if (!record) return null;

  // Mark token as used
  await db
    .update(magicTokens)
    .set({ used: true })
    .where(eq(magicTokens.id, record.id));

  // Find or create user
  let user = await db.query.users.findFirst({
    where: eq(users.email, record.email),
  });

  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values({ email: record.email })
      .returning();
    user = newUser;
  }

  // Create session via Lucia
  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  const cookieStore = await cookies();
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  return { userId: user.id, sessionId: session.id };
}

// Get current session from cookie
export async function getSession(): Promise<{
  userId: string;
  sessionId: string;
} | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) return null;

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session) return null;

  return { userId: user.id, sessionId: session.id };
}

// Logout — delete session and clear cookie
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await lucia.invalidateSession(sessionId);
    const blankCookie = lucia.createBlankSessionCookie();
    cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
  }
}
