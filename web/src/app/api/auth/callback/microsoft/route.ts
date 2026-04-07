import { NextRequest, NextResponse } from "next/server";
import { getProviders } from "@/lib/auth/arctic";
import { lucia } from "@/lib/auth/lucia";
import { db } from "@/db";
import { users, oauthAccounts } from "@/db/auth-schema";
import { eq, and } from "drizzle-orm";
import { log } from "@/lib/logger";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

function errorRedirect() {
  return NextResponse.redirect(new URL("/login?error=oauth_failed", BASE_URL));
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const providers = getProviders();
    const microsoft = providers.microsoft;

    if (!microsoft) {
      log.warn("Microsoft OAuth provider not configured");
      return errorRedirect();
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const storedState = req.cookies.get("microsoft_oauth_state")?.value;
    const codeVerifier = req.cookies.get("microsoft_code_verifier")?.value;

    if (!code || !state || !storedState || !codeVerifier) {
      log.warn("Microsoft OAuth callback: missing params or cookies");
      return errorRedirect();
    }

    if (state !== storedState) {
      log.warn("Microsoft OAuth callback: state mismatch");
      return errorRedirect();
    }

    const tokens = await microsoft.validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();

    const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!meRes.ok) {
      log.warn({ status: meRes.status }, "Microsoft Graph /me request failed");
      return errorRedirect();
    }

    const meData = (await meRes.json()) as {
      id: string;
      mail: string | null;
      userPrincipalName: string | null;
    };

    const email = (meData.mail ?? meData.userPrincipalName ?? "").toLowerCase();
    const providerAccountId = meData.id;

    if (!email || !providerAccountId) {
      log.warn("Microsoft OAuth: missing email or id");
      return errorRedirect();
    }

    // Find or create user
    let userId: string;

    const existingUser = await db.query.users?.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const [newUser] = await db
        .insert(users)
        .values({ email })
        .returning({ id: users.id });
      userId = newUser.id;
    }

    // Link OAuth account if not already linked
    const existingAccount = await db.query.oauthAccounts?.findFirst({
      where: and(
        eq(oauthAccounts.userId, userId),
        eq(oauthAccounts.provider, "microsoft"),
        eq(oauthAccounts.providerAccountId, providerAccountId),
      ),
    });

    if (!existingAccount) {
      await db.insert(oauthAccounts).values({
        userId,
        provider: "microsoft",
        providerAccountId,
      });
    }

    // Create Lucia session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    const response = NextResponse.redirect(new URL("/intake", BASE_URL));

    response.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    // Clean up OAuth cookies
    response.cookies.delete("microsoft_oauth_state");
    response.cookies.delete("microsoft_code_verifier");

    return response;
  } catch (error: unknown) {
    log.warn({ err: error }, "Microsoft OAuth callback error");
    return errorRedirect();
  }
}
