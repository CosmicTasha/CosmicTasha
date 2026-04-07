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
    const github = providers.github;

    if (!github) {
      log.warn("GitHub OAuth provider not configured");
      return errorRedirect();
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const storedState = req.cookies.get("github_oauth_state")?.value;

    if (!code || !state || !storedState) {
      log.warn("GitHub OAuth callback: missing params or cookies");
      return errorRedirect();
    }

    if (state !== storedState) {
      log.warn("GitHub OAuth callback: state mismatch");
      return errorRedirect();
    }

    const tokens = await github.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    // Fetch GitHub user profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "CosmicTasha",
        Accept: "application/vnd.github+json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!userRes.ok) {
      log.warn({ status: userRes.status }, "GitHub /user request failed");
      return errorRedirect();
    }

    const githubUser = (await userRes.json()) as {
      id: number;
      email: string | null;
    };

    let email = githubUser.email;

    // If public email not set, fetch from emails endpoint
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "CosmicTasha",
          Accept: "application/vnd.github+json",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!emailsRes.ok) {
        log.warn({ status: emailsRes.status }, "GitHub /user/emails request failed");
        return errorRedirect();
      }

      const emails = (await emailsRes.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;

      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email ?? null;
    }

    const providerAccountId = String(githubUser.id);

    if (!email || !providerAccountId) {
      log.warn("GitHub OAuth: missing email or id");
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
        eq(oauthAccounts.provider, "github"),
        eq(oauthAccounts.providerAccountId, providerAccountId),
      ),
    });

    if (!existingAccount) {
      await db.insert(oauthAccounts).values({
        userId,
        provider: "github",
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
    response.cookies.delete("github_oauth_state");

    return response;
  } catch (error: unknown) {
    log.warn({ err: error }, "GitHub OAuth callback error");
    return errorRedirect();
  }
}
