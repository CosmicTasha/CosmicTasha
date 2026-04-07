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
    const google = providers.google;

    if (!google) {
      log.warn("Google OAuth provider not configured");
      return errorRedirect();
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const storedState = req.cookies.get("google_oauth_state")?.value;
    const codeVerifier = req.cookies.get("google_code_verifier")?.value;

    if (!code || !state || !storedState || !codeVerifier) {
      log.warn("Google OAuth callback: missing params or cookies");
      return errorRedirect();
    }

    if (state !== storedState) {
      log.warn("Google OAuth callback: state mismatch");
      return errorRedirect();
    }

    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();

    const userInfoRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!userInfoRes.ok) {
      log.warn({ status: userInfoRes.status }, "Google userinfo request failed");
      return errorRedirect();
    }

    const userInfo = (await userInfoRes.json()) as {
      sub: string;
      email: string;
    };

    const { sub: providerAccountId, email } = userInfo;

    if (!email || !providerAccountId) {
      log.warn("Google OAuth: missing email or sub in userinfo");
      return errorRedirect();
    }

    // Find or create user
    let userId: string;

    const existingUser = await db.query.users?.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const [newUser] = await db
        .insert(users)
        .values({ email: email.toLowerCase() })
        .returning({ id: users.id });
      userId = newUser.id;
    }

    // Link OAuth account if not already linked
    const existingAccount = await db.query.oauthAccounts?.findFirst({
      where: and(
        eq(oauthAccounts.userId, userId),
        eq(oauthAccounts.provider, "google"),
        eq(oauthAccounts.providerAccountId, providerAccountId),
      ),
    });

    if (!existingAccount) {
      await db.insert(oauthAccounts).values({
        userId,
        provider: "google",
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
    response.cookies.delete("google_oauth_state");
    response.cookies.delete("google_code_verifier");

    return response;
  } catch (error: unknown) {
    log.warn({ err: error }, "Google OAuth callback error");
    return errorRedirect();
  }
}
