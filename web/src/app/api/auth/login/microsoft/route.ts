import { NextResponse } from "next/server";
import { generateState, generateCodeVerifier } from "arctic";
import { getProviders } from "@/lib/auth/arctic";
import { log } from "@/lib/logger";

export async function GET(): Promise<NextResponse> {
  try {
    const providers = getProviders();
    const microsoft = providers.microsoft;

    if (!microsoft) {
      log.warn("Microsoft OAuth provider not configured");
      return NextResponse.json(
        { error: "Microsoft OAuth not configured" },
        { status: 501 },
      );
    }

    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const url = microsoft.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "email",
      "User.Read",
    ]);

    const response = NextResponse.redirect(url);

    response.cookies.set("microsoft_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    response.cookies.set("microsoft_code_verifier", codeVerifier, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    log.warn({ err: error }, "Microsoft OAuth login error");
    return NextResponse.redirect(new URL("/login?error=oauth_failed", process.env.BASE_URL ?? "http://localhost:3000"));
  }
}
