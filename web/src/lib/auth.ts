// Core auth functions — magic link + DB-backed sessions

import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { sessions, magicTokens } from '@/db/auth-schema';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';

const SESSION_COOKIE = 'ct_session';
const SESSION_DURATION_DAYS = 30;

// Generate a magic link token (random, 15min expiry)
export async function createMagicToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db.insert(magicTokens).values({
    email,
    token,
    expiresAt,
  });

  return token;
}

// Verify magic token and create session
export async function verifyMagicToken(
  token: string,
): Promise<{ userId: string; sessionId: string } | null> {
  const record = await db.query.magicTokens.findFirst({
    where: and(
      eq(magicTokens.token, token),
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

  // Create session
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
  });

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return { userId: user.id, sessionId };
}

// Get current session from cookie
export async function getSession(): Promise<{
  userId: string;
  sessionId: string;
} | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) return null;

  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, sessionId),
      gt(sessions.expiresAt, new Date()),
    ),
  });

  if (!session) return null;

  return { userId: session.userId, sessionId: session.id };
}

// Logout — delete session and clear cookie
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    cookieStore.delete(SESSION_COOKIE);
  }
}
