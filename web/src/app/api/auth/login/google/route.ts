import { NextResponse } from "next/server";
import { generateState, generateCodeVerifier } from "arctic";
import { getProviders } from "@/lib/auth/arctic";
import { log } from "@/lib/logger";

export async function GET(): Promise<NextResponse> {
  try {
    const providers = getProviders();
    const google = providers.google;

    if (!google) {
      log.warn("Google OAuth provider not configured");
      return NextResponse.json(
        { error: "Google OAuth not configured" },
        { status: 501 },
      );
    }

    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const url = google.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "email",
    ]);

    const response = NextResponse.redirect(url);

    response.cookies.set("google_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    response.cookies.set("google_code_verifier", codeVerifier, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    log.warn({ err: error }, "Google OAuth login error");
    return NextResponse.redirect(new URL("/login?error=oauth_failed", process.env.BASE_URL ?? "http://localhost:3000"));
  }
}
