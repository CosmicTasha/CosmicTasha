import { NextResponse } from "next/server";
import { generateState } from "arctic";
import { getProviders } from "@/lib/auth/arctic";
import { log } from "@/lib/logger";

export async function GET(): Promise<NextResponse> {
  try {
    const providers = getProviders();
    const github = providers.github;

    if (!github) {
      log.warn("GitHub OAuth provider not configured");
      return NextResponse.json(
        { error: "GitHub OAuth not configured" },
        { status: 501 },
      );
    }

    const state = generateState();

    const url = github.createAuthorizationURL(state, ["user:email"]);

    const response = NextResponse.redirect(url);

    response.cookies.set("github_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    log.warn({ err: error }, "GitHub OAuth login error");
    return NextResponse.redirect(new URL("/login?error=oauth_failed", process.env.BASE_URL ?? "http://localhost:3000"));
  }
}
