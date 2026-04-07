import { Google, GitHub, MicrosoftEntraId } from "arctic";

export type OAuthProvider = "google" | "github" | "microsoft";

export function getProviders(): Partial<Record<OAuthProvider, Google | GitHub | MicrosoftEntraId>> {
  const providers: Partial<Record<OAuthProvider, Google | GitHub | MicrosoftEntraId>> = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = new Google(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BASE_URL ?? "http://localhost:3000"}/api/auth/callback/google`
    );
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.github = new GitHub(
      process.env.GITHUB_CLIENT_ID,
      process.env.GITHUB_CLIENT_SECRET,
      `${process.env.BASE_URL ?? "http://localhost:3000"}/api/auth/callback/github`
    );
  }

  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    providers.microsoft = new MicrosoftEntraId(
      process.env.MICROSOFT_TENANT_ID ?? "common",
      process.env.MICROSOFT_CLIENT_ID,
      process.env.MICROSOFT_CLIENT_SECRET,
      `${process.env.BASE_URL ?? "http://localhost:3000"}/api/auth/callback/microsoft`
    );
  }

  return providers;
}
