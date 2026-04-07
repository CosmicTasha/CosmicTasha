# Auth + biged-rs + Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Lucia auth with OAuth (Google/GitHub/Microsoft), integrate biged-rs as inference platform with fallback chain, and build 14 SOC 2 compliance templates with 8 scoring dimensions.

**Architecture:** Three phases built in dependency order: B (auth + security) -> A (biged-rs integration) -> C (templates + scoring). Each phase produces working software. The auth middleware from Phase B protects Phase A and C endpoints. The InferenceRouter from Phase A powers Phase C's doc generation. Demo path stays functional throughout.

**Tech Stack:** Next.js 16, Lucia v3, Arctic, Drizzle ORM, Neon PostgreSQL, Resend (email), pino (logging), Zod (validation)

**Spec:** `docs/superpowers/specs/2026-04-07-auth-biged-templates-design.md`

**Working directory:** `f:\Projects\CosmicTasha\web`

---

## File Structure

### Phase B — Auth & Security

```
src/lib/auth/
  lucia.ts              # Lucia instance + PostgreSQL adapter via Drizzle
  arctic.ts             # Arctic OAuth provider configs (Google, GitHub, Microsoft)
  middleware.ts          # withAuth() wrapper: extracts session, validates ownership
  session-ownership.ts  # claimSession(), verifyOwnership() helpers
  email/
    provider.ts         # EmailProvider interface + factory
    console.ts          # ConsoleProvider (dev — logs to stdout)
    resend.ts           # ResendProvider (prod — sends via Resend API)

src/middleware.ts        # Next.js edge middleware: rate limiting, CSRF origin check

src/app/api/auth/
  login/google/route.ts
  login/github/route.ts
  login/microsoft/route.ts
  callback/google/route.ts
  callback/github/route.ts
  callback/microsoft/route.ts
  claim-session/route.ts  # POST: claim anonymous session after login

src/db/
  auth-schema.ts          # MODIFY: add oauthAccounts, subscriptions tables
  schema.ts               # MODIFY: change gaps.dimension to text()

drizzle/
  0002_auth_hardening.sql # RLS policies + new tables

src/lib/tier.ts           # MODIFY: server-side getTier() from DB
src/lib/auth.ts           # MODIFY: refactor to use Lucia, hash magic tokens
src/lib/logger.ts         # NEW: pino logger with PII redaction

tests/
  lib/auth/lucia.test.ts
  lib/auth/middleware.test.ts
  lib/auth/email.test.ts
  api/auth/oauth.test.ts
  api/auth/claim-session.test.ts
```

### Phase A — biged-rs Integration

```
src/lib/inference/
  types.ts              # InferenceProvider, InferenceResult, InferenceOpts
  router.ts             # InferenceRouter: tries providers in order
  providers/
    biged.ts            # BigEdProvider: dispatch via /api/tasks/dispatch
    local-ollama.ts     # LocalOllamaProvider: refactored from ollama/client.ts
    ollama-cloud.ts     # OllamaCloudProvider: same API, different host
    mock.ts             # MockProvider: extracts mockProse from generator.ts

src/lib/biged/
  client.ts             # MODIFY: wire submitProfile, dispatchTask, ollamaStatus, TLS
  types.ts              # MODIFY: add ComplianceProfile, TaskDispatch types
  events.ts             # MODIFY: SSE listener for task_updated events

src/app/api/
  docs/generate/route.ts  # MODIFY: use InferenceRouter + task dispatch
  biged/status/route.ts   # MODIFY: include inference router status

tests/
  lib/inference/router.test.ts
  lib/inference/providers.test.ts
  lib/biged/client.test.ts
```

### Phase C — Templates + Score Rift

```
src/lib/compliance-kb/
  types.ts              # Dimension, DimensionResult, Finding, ReadinessScore, ComplianceTemplate
  engine.ts             # ScoreEngine: runs 8 dimensions, produces ReadinessScore
  index.ts              # Public API exports

  soc2/
    dimensions/
      access-control.ts
      system-operations.ts
      data-protection.ts
      change-management.ts
      risk-assessment.ts
      vendor-management.ts
      hr-training.ts
      business-continuity.ts

    templates/
      system-description.ts
      information-security-policy.ts
      incident-response-plan.ts
      access-control-policy.ts
      change-management-policy.ts
      risk-assessment.ts
      data-classification.ts
      business-continuity-dr.ts
      vendor-management-policy.ts
      encryption-policy.ts
      acceptable-use-policy.ts
      security-awareness-training.ts
      audit-log-review.ts
      access-review-templates.ts

    guidance/
      auditor-expectations.ts
      common-findings.ts
      remediation-paths.ts

src/app/api/
  intake/score/route.ts    # NEW: server-side scoring endpoint
  docs/generate/route.ts   # MODIFY: use ComplianceTemplate + ScoreEngine

drizzle/
  0003_generated_documents.sql

tests/
  lib/compliance-kb/engine.test.ts
  lib/compliance-kb/dimensions.test.ts
  lib/compliance-kb/templates.test.ts
```

---

## Phase B — Auth & Security

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Lucia + Arctic + Resend + pino + Zod**

```bash
cd f:/Projects/CosmicTasha/web
npm install lucia @lucia-auth/adapter-drizzle arctic resend pino zod
```

- [ ] **Step 2: Verify install**

```bash
npm ls lucia arctic resend pino zod
```

Expected: all packages listed without errors

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lucia, arctic, resend, pino, zod dependencies"
```

---

### Task 2: Structured Logger

**Files:**
- Create: `src/lib/logger.ts`
- Test: `tests/lib/logger.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/logger.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("logger", () => {
  it("exports a pino logger instance", async () => {
    const { log } = await import("@/lib/logger");
    expect(log).toBeDefined();
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/logger.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/logger.ts`:

```typescript
import pino from "pino";

export const log = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "*.token",
      "*.magicLink",
      "*.password",
      "*.secret",
      "*.apiKey",
    ],
    censor: "[REDACTED]",
  },
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/lib/logger.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/logger.ts tests/lib/logger.test.ts
git commit -m "feat(auth): add pino structured logger with PII redaction"
```

---

### Task 3: Database Schema Updates

**Files:**
- Modify: `src/db/auth-schema.ts`
- Modify: `src/db/schema.ts`
- Modify: `src/db/index.ts`

- [ ] **Step 1: Add oauthAccounts and subscriptions to auth-schema.ts**

In `src/db/auth-schema.ts`, add after the existing `magicTokens` table:

```typescript
export const oauthAccounts = pgTable("oauth_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'google' | 'github' | 'microsoft'
  providerAccountId: text("provider_account_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tier: text("tier").notNull().default("discovery"),
  startsAt: timestamp("starts_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
```

- [ ] **Step 2: Change gaps.dimension to text in schema.ts**

In `src/db/schema.ts`, find the `dimension` column in the `gaps` table and change from the enum to:

```typescript
dimension: text("dimension").notNull(),
```

Remove the enum definition if it exists as a separate `pgEnum`.

- [ ] **Step 2.5: Ensure sessions table is Lucia-compatible**

The existing `sessions` table in `auth-schema.ts` needs a `fresh` column for Lucia v3 internal state tracking. Drizzle-kit will generate this in the migration. Add to the sessions table definition:

```typescript
fresh: boolean("fresh").default(true),
```

If Lucia's DrizzlePostgreSQLAdapter handles `fresh` automatically (check docs at build time), skip this — but verify by running the Lucia test in Task 4.

- [ ] **Step 3: Add new tables to db/index.ts schema export**

In `src/db/index.ts`, add `oauthAccounts` and `subscriptions` to the schema object passed to `drizzle()`.

- [ ] **Step 4: Generate migration**

```bash
npx drizzle-kit generate
```

Review the generated SQL file. It should add `oauth_accounts`, `subscriptions`, and alter `gaps.dimension`.

- [ ] **Step 5: Commit**

```bash
git add src/db/auth-schema.ts src/db/schema.ts src/db/index.ts drizzle/
git commit -m "feat(auth): add oauth_accounts, subscriptions tables; gaps dimension to text"
```

---

### Task 4: Lucia Setup

**Files:**
- Create: `src/lib/auth/lucia.ts`
- Test: `tests/lib/auth/lucia.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/auth/lucia.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("lucia", () => {
  it("exports lucia instance and session types", async () => {
    const { lucia } = await import("@/lib/auth/lucia");
    expect(lucia).toBeDefined();
    expect(typeof lucia.createSession).toBe("function");
    expect(typeof lucia.validateSession).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/auth/lucia.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/lib/auth/lucia.ts`:

```typescript
import { Lucia } from "lucia";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "@/db";
import { sessions, users } from "@/db/auth-schema";

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  getUserAttributes: (attributes) => ({
    email: attributes.email,
  }),
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: { email: string };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/lib/auth/lucia.test.ts
```

Expected: PASS (may need DB mock — if Neon connection fails in test, mock the adapter)

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/lucia.ts tests/lib/auth/lucia.test.ts
git commit -m "feat(auth): lucia v3 setup with Drizzle PostgreSQL adapter"
```

---

### Task 5: Arctic OAuth Providers

**Files:**
- Create: `src/lib/auth/arctic.ts`
- Test: `tests/lib/auth/arctic.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/auth/arctic.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("arctic providers", () => {
  it("exports provider instances when env vars are set", async () => {
    const { getProviders } = await import("@/lib/auth/arctic");
    const providers = getProviders();
    // All optional — returns only configured providers
    expect(typeof providers).toBe("object");
  });

  it("returns empty object when no env vars set", async () => {
    const { getProviders } = await import("@/lib/auth/arctic");
    const providers = getProviders();
    // In test env, no OAuth env vars → empty
    expect(Object.keys(providers).length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/auth/arctic.test.ts
```

- [ ] **Step 3: Write implementation**

Create `src/lib/auth/arctic.ts`:

```typescript
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
```

- [ ] **Step 4: Run test, verify pass**

```bash
npx vitest run tests/lib/auth/arctic.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/arctic.ts tests/lib/auth/arctic.test.ts
git commit -m "feat(auth): arctic OAuth provider configs (Google, GitHub, Microsoft)"
```

---

### Task 6: Email Provider Interface

**Files:**
- Create: `src/lib/auth/email/provider.ts`
- Create: `src/lib/auth/email/console.ts`
- Create: `src/lib/auth/email/resend.ts`
- Test: `tests/lib/auth/email.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/auth/email.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("email provider", () => {
  it("console provider logs magic link without throwing", async () => {
    const { ConsoleProvider } = await import("@/lib/auth/email/console");
    const provider = new ConsoleProvider();
    await expect(
      provider.sendMagicLink("test@example.com", "tok123", "http://localhost:3000/verify")
    ).resolves.toBeUndefined();
  });

  it("getEmailProvider returns ConsoleProvider by default", async () => {
    const { getEmailProvider } = await import("@/lib/auth/email/provider");
    const provider = getEmailProvider();
    expect(provider.constructor.name).toBe("ConsoleProvider");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/auth/email.test.ts
```

- [ ] **Step 3: Write implementations**

Create `src/lib/auth/email/provider.ts`:

```typescript
export interface EmailProvider {
  sendMagicLink(email: string, token: string, url: string): Promise<void>;
  sendScoringComplete(email: string, jobId: string, score: number): Promise<void>;
}

export function getEmailProvider(): EmailProvider {
  if (process.env.EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) {
    // Dynamic import to avoid loading Resend SDK when not needed
    const { ResendProvider } = require("./resend");
    return new ResendProvider(process.env.RESEND_API_KEY);
  }
  const { ConsoleProvider } = require("./console");
  return new ConsoleProvider();
}
```

Create `src/lib/auth/email/console.ts`:

```typescript
import type { EmailProvider } from "./provider";
import { log } from "@/lib/logger";

export class ConsoleProvider implements EmailProvider {
  async sendMagicLink(email: string, _token: string, url: string): Promise<void> {
    log.info({ email: "[redacted]", url }, "Magic link generated (console mode)");
  }

  async sendScoringComplete(email: string, jobId: string, score: number): Promise<void> {
    log.info({ email: "[redacted]", jobId, score }, "Scoring complete (console mode)");
  }
}
```

Create `src/lib/auth/email/resend.ts`:

```typescript
import { Resend } from "resend";
import type { EmailProvider } from "./provider";
import { log } from "@/lib/logger";

export class ResendProvider implements EmailProvider {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async sendMagicLink(email: string, _token: string, url: string): Promise<void> {
    await this.client.emails.send({
      from: "DriftWatch <noreply@driftwatch.dev>",
      to: email,
      subject: "Your DriftWatch login link",
      html: `<p>Click below to sign in:</p><p><a href="${url}">Sign in to DriftWatch</a></p><p>This link expires in 15 minutes.</p>`,
    });
    log.info("Magic link email sent via Resend");
  }

  async sendScoringComplete(email: string, jobId: string, score: number): Promise<void> {
    await this.client.emails.send({
      from: "DriftWatch <noreply@driftwatch.dev>",
      to: email,
      subject: "Your DriftWatch readiness score is ready",
      html: `<p>Your readiness score: <strong>${score}/100</strong></p><p><a href="${process.env.BASE_URL}/intake/results?job=${jobId}">View Full Results</a></p>`,
    });
    log.info({ jobId, score }, "Scoring complete email sent via Resend");
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npx vitest run tests/lib/auth/email.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/email/ tests/lib/auth/email.test.ts
git commit -m "feat(auth): email provider interface with Console + Resend implementations"
```

---

### Task 7: Auth Middleware

**Files:**
- Create: `src/lib/auth/middleware.ts`
- Create: `src/lib/auth/session-ownership.ts`
- Test: `tests/lib/auth/middleware.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/auth/middleware.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

describe("withAuth", () => {
  it("returns 401 when no session cookie", async () => {
    const { withAuth } = await import("@/lib/auth/middleware");
    const handler = withAuth(async (_req, _session) => {
      return new Response("ok");
    });
    const req = new Request("http://localhost:3000/api/test", { method: "GET" });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });
});

describe("verifyOwnership", () => {
  it("exports verifyOwnership function", async () => {
    const { verifyOwnership } = await import("@/lib/auth/session-ownership");
    expect(typeof verifyOwnership).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/auth/middleware.test.ts
```

- [ ] **Step 3: Write implementations**

Create `src/lib/auth/middleware.ts`:

```typescript
import { cookies } from "next/headers";
import { lucia } from "./lucia";
import { log } from "@/lib/logger";

interface AuthSession {
  userId: string;
  sessionId: string;
}

type AuthHandler = (
  req: Request,
  session: AuthSession
) => Promise<Response>;

export function withAuth(handler: AuthHandler) {
  return async (req: Request): Promise<Response> => {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(lucia.sessionCookieName)?.value;

    if (!sessionId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { session, user } = await lucia.validateSession(sessionId);

    if (!session) {
      return Response.json({ error: "Session expired" }, { status: 401 });
    }

    // Refresh session cookie if needed
    if (session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookieStore.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
    }

    return handler(req, { userId: user.id, sessionId: session.id });
  };
}
```

Create `src/lib/auth/session-ownership.ts`:

```typescript
import { db } from "@/db";
import { intakeSessions } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function verifyOwnership(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const session = await db.query.intakeSessions.findFirst({
    where: and(
      eq(intakeSessions.id, sessionId),
      eq(intakeSessions.userId, userId)
    ),
    columns: { id: true },
  });
  return session !== undefined;
}

export async function claimSession(
  intakeSessionId: string,
  userId: string
): Promise<"claimed" | "already_claimed" | "not_found"> {
  const result = await db
    .update(intakeSessions)
    .set({ userId })
    .where(
      and(
        eq(intakeSessions.id, intakeSessionId),
        isNull(intakeSessions.userId)
      )
    )
    .returning({ id: intakeSessions.id });

  if (result.length > 0) return "claimed";

  // Check if session exists but is already claimed
  const existing = await db.query.intakeSessions.findFirst({
    where: eq(intakeSessions.id, intakeSessionId),
    columns: { userId: true },
  });

  if (!existing) return "not_found";
  return "already_claimed";
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npx vitest run tests/lib/auth/middleware.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/middleware.ts src/lib/auth/session-ownership.ts tests/lib/auth/middleware.test.ts
git commit -m "feat(auth): withAuth middleware + session ownership verification"
```

---

### Task 8: OAuth Routes (Google, GitHub, Microsoft)

**Files:**
- Create: `src/app/api/auth/login/google/route.ts`
- Create: `src/app/api/auth/login/github/route.ts`
- Create: `src/app/api/auth/login/microsoft/route.ts`
- Create: `src/app/api/auth/callback/google/route.ts`
- Create: `src/app/api/auth/callback/github/route.ts`
- Create: `src/app/api/auth/callback/microsoft/route.ts`
- Test: `tests/api/auth/oauth.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/api/auth/oauth.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("OAuth login routes", () => {
  it("google login returns redirect when configured", async () => {
    const { GET } = await import("@/app/api/auth/login/google/route");
    expect(typeof GET).toBe("function");
  });

  it("github login returns redirect when configured", async () => {
    const { GET } = await import("@/app/api/auth/login/github/route");
    expect(typeof GET).toBe("function");
  });

  it("microsoft login returns redirect when configured", async () => {
    const { GET } = await import("@/app/api/auth/login/microsoft/route");
    expect(typeof GET).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/api/auth/oauth.test.ts
```

- [ ] **Step 3: Write OAuth login routes**

All three follow the same pattern. Here is Google as the template:

Create `src/app/api/auth/login/google/route.ts`:

```typescript
import { generateState, generateCodeVerifier } from "arctic";
import { getProviders } from "@/lib/auth/arctic";
import { cookies } from "next/headers";

export async function GET(): Promise<Response> {
  const { google } = getProviders();
  if (!google) {
    return Response.json({ error: "Google OAuth not configured" }, { status: 501 });
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "email"]);

  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  cookieStore.set("oauth_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return Response.redirect(url);
}
```

Create `src/app/api/auth/login/github/route.ts` (same pattern, swap `google` for `github`, scopes: `["user:email"]`).

Create `src/app/api/auth/login/microsoft/route.ts` (same pattern, swap for `microsoft`, scopes: `["openid", "email"]`).

- [ ] **Step 4: Write OAuth callback routes**

Create `src/app/api/auth/callback/google/route.ts`:

```typescript
import { getProviders } from "@/lib/auth/arctic";
import { lucia } from "@/lib/auth/lucia";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { oauthAccounts } from "@/db/auth-schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { log } from "@/lib/logger";

export async function GET(req: Request): Promise<Response> {
  const { google } = getProviders();
  if (!google) {
    return Response.json({ error: "Google OAuth not configured" }, { status: 501 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  const codeVerifier = cookieStore.get("oauth_code_verifier")?.value;

  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    return Response.json({ error: "Invalid OAuth callback" }, { status: 400 });
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      signal: AbortSignal.timeout(10_000),
    });
    const googleUser = await response.json();
    const email = googleUser.email as string;
    const googleId = googleUser.sub as string;

    // Check for existing OAuth link
    const existingAccount = await db.query.oauthAccounts.findFirst({
      where: and(
        eq(oauthAccounts.provider, "google"),
        eq(oauthAccounts.providerAccountId, googleId)
      ),
    });

    let userId: string;

    if (existingAccount) {
      userId = existingAccount.userId;
    } else {
      // Find or create user by email
      let user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        const [newUser] = await db.insert(users).values({ email }).returning();
        user = newUser;
      }

      // Link OAuth account
      await db.insert(oauthAccounts).values({
        userId: user.id,
        provider: "google",
        providerAccountId: googleId,
      });

      userId = user.id;
    }

    // Create Lucia session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    // Clean up OAuth cookies
    cookieStore.delete("oauth_state");
    cookieStore.delete("oauth_code_verifier");

    log.info({ provider: "google" }, "OAuth login successful");
    return Response.redirect(new URL("/intake", req.url));
  } catch (error) {
    log.error({ error }, "OAuth callback failed");
    return Response.redirect(new URL("/login?error=oauth_failed", req.url));
  }
}
```

Create callback routes for GitHub and Microsoft following the same pattern. Key differences:
- **GitHub:** use `https://api.github.com/user` + `https://api.github.com/user/emails` endpoints, provider = "github"
- **Microsoft:** use `https://graph.microsoft.com/v1.0/me` endpoint, provider = "microsoft"

- [ ] **Step 5: Run tests, verify pass**

```bash
npx vitest run tests/api/auth/oauth.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/auth/login/ src/app/api/auth/callback/ tests/api/auth/oauth.test.ts
git commit -m "feat(auth): OAuth login + callback routes for Google, GitHub, Microsoft"
```

---

### Task 9: Refine Magic Link (Hash Tokens, POST Verify)

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/app/api/auth/magic-link/route.ts`
- Modify: `src/app/api/auth/verify/route.ts`

- [ ] **Step 1: Hash magic tokens before DB insert**

In `src/lib/auth.ts`, modify `createMagicToken()`:

```typescript
import { createHash } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createMagicToken(email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(magicTokens).values({
    email,
    token: hashedToken, // Store hash, not plaintext
    expiresAt,
    used: false,
  });

  return token; // Return plaintext to send in email
}
```

Modify `verifyMagicToken()` to hash the incoming token before comparing:

```typescript
export async function verifyMagicToken(token: string) {
  const hashedToken = hashToken(token);
  const record = await db.query.magicTokens.findFirst({
    where: and(
      eq(magicTokens.token, hashedToken),
      eq(magicTokens.used, false),
      gt(magicTokens.expiresAt, new Date())
    ),
  });
  // ... rest unchanged
}
```

- [ ] **Step 2: Strip token from dev response**

In `src/app/api/auth/magic-link/route.ts`, remove token/magicLink from JSON response:

```typescript
// Before: returned token + magicLink in dev mode
// After: only log to console, never in HTTP response
const { getEmailProvider } = await import("@/lib/auth/email/provider");
const provider = getEmailProvider();
await provider.sendMagicLink(email, token, magicLink);

return NextResponse.json({ ok: true, message: "Check your email" });
// Token is NEVER in the response body, even in dev
```

- [ ] **Step 3: Change verify from GET to POST**

In `src/app/api/auth/verify/route.ts`, change the handler:

```typescript
// Before: export async function GET(req: NextRequest)
// After:
export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }
  // ... rest of verification logic (use Lucia for session creation)
}
```

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/magic-link/route.ts src/app/api/auth/verify/route.ts
git commit -m "fix(auth): hash magic tokens at rest, strip from response, verify via POST"
```

---

### Task 10: Next.js Edge Middleware (Rate Limiting + CSRF)

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write Next.js middleware**

Create `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit auth endpoints
  if (pathname.startsWith("/api/auth/magic-link")) {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`magic:${ip}`, 5, 3600_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (pathname.startsWith("/api/auth/verify")) {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`verify:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  // CSRF: validate Origin on state-changing requests
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    if (pathname.startsWith("/api/")) {
      const origin = req.headers.get("origin");
      const host = req.headers.get("host");
      if (origin && host && !origin.includes(host)) {
        return NextResponse.json({ error: "CSRF rejected" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(auth): Next.js middleware with rate limiting and CSRF origin check"
```

---

### Task 11: Server-Side Tier Enforcement

**Files:**
- Modify: `src/lib/tier.ts`
- Test: `tests/lib/tier.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/tier.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("getTierFromDb", () => {
  it("returns discovery when no subscription exists", async () => {
    const { getTierFromDb } = await import("@/lib/tier");
    // With a non-existent userId, should return discovery
    const tier = await getTierFromDb("00000000-0000-0000-0000-000000000000");
    expect(tier).toBe("discovery");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/tier.test.ts
```

- [ ] **Step 3: Add server-side getTierFromDb**

Add to `src/lib/tier.ts`:

```typescript
import { db } from "@/db";
import { subscriptions } from "@/db/auth-schema";
import { eq, and, gt, desc } from "drizzle-orm";

export async function getTierFromDb(userId: string): Promise<Tier> {
  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      gt(subscriptions.endsAt, new Date())
    ),
    orderBy: [desc(subscriptions.createdAt)],
    columns: { tier: true },
  });

  return (sub?.tier as Tier) ?? "discovery";
}
```

Keep the existing client-side `getCurrentTier()` for the demo path but add a comment:

```typescript
/** @deprecated Use getTierFromDb() on the server. This is client-side only for demo mode. */
export function getCurrentTier(): Tier {
  // ... existing localStorage code
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npx vitest run tests/lib/tier.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/tier.ts tests/lib/tier.test.ts
git commit -m "feat(auth): server-side tier enforcement from subscriptions table"
```

---

### Task 12: Apply Auth to Intake Routes

**Files:**
- Modify: `src/app/api/intake/answer/route.ts`
- Modify: `src/app/api/intake/progress/route.ts`
- Modify: `src/app/api/intake/profile/route.ts`
- Modify: `src/app/api/intake/session/route.ts` (GET only)
- Modify: `src/app/api/intake/invite/route.ts`
- Create: `src/app/api/auth/claim-session/route.ts`

- [ ] **Step 1: Add claim-session route**

Create `src/app/api/auth/claim-session/route.ts`:

```typescript
import { withAuth } from "@/lib/auth/middleware";
import { claimSession } from "@/lib/auth/session-ownership";

export const POST = withAuth(async (req, session) => {
  const { sessionId } = await req.json();
  if (!sessionId) {
    return Response.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const result = await claimSession(sessionId, session.userId);

  switch (result) {
    case "claimed":
      return Response.json({ ok: true });
    case "already_claimed":
      return Response.json({ error: "Session belongs to another account" }, { status: 409 });
    case "not_found":
      return Response.json({ error: "Session not found" }, { status: 404 });
  }
});
```

- [ ] **Step 2: Wrap intake answer route with withAuth**

In `src/app/api/intake/answer/route.ts`:

```typescript
import { withAuth } from "@/lib/auth/middleware";
import { verifyOwnership } from "@/lib/auth/session-ownership";

export const POST = withAuth(async (req, session) => {
  const body = await req.json();
  const { sessionId, questionId, stage, value } = body;

  if (!sessionId || !questionId || stage === undefined || value === undefined) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify the session belongs to this user
  if (!(await verifyOwnership(sessionId, session.userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // ... existing upsert logic unchanged
});
```

Apply the same pattern to `progress/route.ts`, `profile/route.ts`, and `invite/route.ts`.

- [ ] **Step 3: Protect GET on session route (ownership check)**

In `src/app/api/intake/session/route.ts`, wrap the GET handler:

```typescript
// POST stays public (creates anonymous session)
export async function POST(request: Request) {
  // ... existing code, unchanged
}

// GET requires auth + ownership
export const GET = withAuth(async (req, session) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  // ... existing query + ownership check
  if (!(await verifyOwnership(id, session.userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  // ... return session data
});
```

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/intake/ src/app/api/auth/claim-session/
git commit -m "fix(auth): protect all intake routes with withAuth + ownership validation"
```

---

### Task 13: RLS Migration

**Files:**
- Create: `drizzle/0002_auth_hardening.sql`

- [ ] **Step 1: Write the migration**

Create `drizzle/0002_auth_hardening.sql` with the RLS policies from the spec (the corrected versions with `FOR SELECT/UPDATE/INSERT/DELETE`, `current_setting(name, true)`, no `OR user_id IS NULL`).

- [ ] **Step 2: Apply migration**

```bash
npx drizzle-kit push
```

Or if using migration files:

```bash
npx drizzle-kit migrate
```

- [ ] **Step 3: Verify RLS is active**

Connect to the database and confirm:

```sql
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

Expected: policies on intake_sessions, intake_answers, company_profiles, gaps.

- [ ] **Step 4: Commit**

```bash
git add drizzle/
git commit -m "feat(auth): RLS policies on all intake tables — defense in depth"
```

---

## Phase A — biged-rs Integration

### Task 14: Inference Types

**Files:**
- Create: `src/lib/inference/types.ts`

- [ ] **Step 1: Write types**

Create `src/lib/inference/types.ts`:

```typescript
export interface InferenceOpts {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface InferenceResult {
  text: string;
  model: string;
  provider: "biged-rs" | "local-ollama" | "ollama-cloud" | "mock";
  duration_ms: number;
}

export interface InferenceProvider {
  name: string;
  available(): Promise<boolean>;
  generate(
    prompt: string,
    system: string,
    opts?: InferenceOpts
  ): Promise<InferenceResult>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/inference/types.ts
git commit -m "feat(inference): InferenceProvider interface + result types"
```

---

### Task 15: Mock Provider (Extract from Generator)

**Files:**
- Create: `src/lib/inference/providers/mock.ts`
- Test: `tests/lib/inference/providers.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/inference/providers.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("MockProvider", () => {
  it("is always available", async () => {
    const { MockProvider } = await import("@/lib/inference/providers/mock");
    const provider = new MockProvider();
    expect(await provider.available()).toBe(true);
  });

  it("generates prose for any prompt", async () => {
    const { MockProvider } = await import("@/lib/inference/providers/mock");
    const provider = new MockProvider();
    const result = await provider.generate("Write a policy", "You are helpful");
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.provider).toBe("mock");
    expect(result.model).toBe("mockProse");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/inference/providers.test.ts
```

- [ ] **Step 3: Write implementation**

Create `src/lib/inference/providers/mock.ts`:

Extract the `mockProse()` logic from `src/lib/doc-gen/generator.ts` into a standalone provider:

```typescript
import type { InferenceProvider, InferenceResult, InferenceOpts } from "../types";

export class MockProvider implements InferenceProvider {
  name = "mock";

  async available(): Promise<boolean> {
    return true;
  }

  async generate(
    prompt: string,
    _system: string,
    _opts?: InferenceOpts
  ): Promise<InferenceResult> {
    const start = Date.now();
    // Generate contextual mock prose based on prompt keywords
    const text = generateMockProse(prompt);
    return {
      text,
      model: "mockProse",
      provider: "mock",
      duration_ms: Date.now() - start,
    };
  }
}

function generateMockProse(prompt: string): string {
  // Simplified mock — the full version can be ported from generator.ts
  const lower = prompt.toLowerCase();
  if (lower.includes("incident response")) {
    return "This Incident Response Plan establishes procedures for identifying, responding to, and recovering from security incidents. The plan defines roles, escalation procedures, and communication protocols appropriate for the organization's size and risk profile.";
  }
  if (lower.includes("access control")) {
    return "Access to information systems is managed through role-based access controls with multi-factor authentication enforced for all privileged accounts. Access reviews are conducted quarterly to ensure least-privilege principles are maintained.";
  }
  if (lower.includes("system description")) {
    return "The system processes and stores customer data using cloud-hosted infrastructure with encryption at rest and in transit. The system boundary includes application servers, databases, and supporting network infrastructure.";
  }
  // Default fallback
  return "This section describes the organization's policies and procedures in accordance with applicable compliance requirements. Controls are implemented to maintain the security, availability, and confidentiality of information assets.";
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npx vitest run tests/lib/inference/providers.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/inference/providers/mock.ts tests/lib/inference/providers.test.ts
git commit -m "feat(inference): MockProvider extracted from doc-gen generator"
```

---

### Task 16: Local Ollama Provider

**Files:**
- Create: `src/lib/inference/providers/local-ollama.ts`
- Modify: `tests/lib/inference/providers.test.ts`

- [ ] **Step 1: Add test**

Add to `tests/lib/inference/providers.test.ts`:

```typescript
describe("LocalOllamaProvider", () => {
  it("reports unavailable when Ollama is not running", async () => {
    const { LocalOllamaProvider } = await import("@/lib/inference/providers/local-ollama");
    const provider = new LocalOllamaProvider("http://localhost:99999"); // bad port
    expect(await provider.available()).toBe(false);
  });
});
```

- [ ] **Step 2: Write implementation**

Create `src/lib/inference/providers/local-ollama.ts`:

```typescript
import type { InferenceProvider, InferenceResult, InferenceOpts } from "../types";

export class LocalOllamaProvider implements InferenceProvider {
  name = "local-ollama";
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl = process.env.OLLAMA_URL ?? "http://localhost:11434",
    model = process.env.OLLAMA_MODEL ?? "qwen3:8b"
  ) {
    this.baseUrl = baseUrl;
    this.defaultModel = model;
  }

  async available(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3_000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generate(
    prompt: string,
    system: string,
    opts?: InferenceOpts
  ): Promise<InferenceResult> {
    const start = Date.now();
    const model = opts?.model ?? this.defaultModel;

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `/no_think\n${prompt}` },
        ],
        stream: false,
        options: {
          temperature: opts?.temperature ?? 0.4,
          num_predict: opts?.maxTokens ?? 500,
        },
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json();

    return {
      text: data.message?.content ?? "",
      model,
      provider: "local-ollama",
      duration_ms: Date.now() - start,
    };
  }
}
```

- [ ] **Step 3: Run tests, verify pass**

```bash
npx vitest run tests/lib/inference/providers.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/inference/providers/local-ollama.ts tests/lib/inference/providers.test.ts
git commit -m "feat(inference): LocalOllamaProvider with health check + /no_think"
```

---

### Task 17: BigEd Provider + Ollama Cloud Provider

**Files:**
- Create: `src/lib/inference/providers/biged.ts`
- Create: `src/lib/inference/providers/ollama-cloud.ts`

- [ ] **Step 1: Write BigEdProvider**

Create `src/lib/inference/providers/biged.ts`:

```typescript
import type { InferenceProvider, InferenceResult, InferenceOpts } from "../types";
import { BigEdClient } from "@/lib/biged/client";

export class BigEdProvider implements InferenceProvider {
  name = "biged-rs";
  private client: BigEdClient;

  constructor(client?: BigEdClient) {
    this.client = client ?? new BigEdClient();
  }

  async available(): Promise<boolean> {
    return this.client.healthCheck();
  }

  async generate(
    prompt: string,
    system: string,
    opts?: InferenceOpts
  ): Promise<InferenceResult> {
    const start = Date.now();
    const dispatch = await this.client.dispatchTask({
      skill: "inference",
      payload: {
        prompt,
        system,
        temperature: opts?.temperature ?? 0.4,
        max_tokens: opts?.maxTokens ?? 500,
        model: opts?.model,
      },
      priority: 5,
    });

    // Poll for completion (v1 — SSE upgrade later via events.ts)
    let result = await this.client.getTask(dispatch.task_id);
    let attempts = 0;
    while (result.status !== "DONE" && result.status !== "FAILED" && attempts < 60) {
      await new Promise((r) => setTimeout(r, 2_000));
      result = await this.client.getTask(dispatch.task_id);
      attempts++;
    }

    if (result.status === "FAILED") {
      throw new Error(`biged-rs task failed: ${result.error}`);
    }

    return {
      text: result.result?.text ?? "",
      model: result.result?.model ?? "unknown",
      provider: "biged-rs",
      duration_ms: Date.now() - start,
    };
  }
}
```

- [ ] **Step 2: Write OllamaCloudProvider**

Create `src/lib/inference/providers/ollama-cloud.ts`:

```typescript
import { LocalOllamaProvider } from "./local-ollama";

export class OllamaCloudProvider extends LocalOllamaProvider {
  constructor() {
    const host = process.env.OLLAMA_CLOUD_HOST;
    if (!host) throw new Error("OLLAMA_CLOUD_HOST not configured");
    super(host, process.env.OLLAMA_MODEL ?? "qwen3:8b");
    this.name = "ollama-cloud";
  }

  override async generate(...args: Parameters<LocalOllamaProvider["generate"]>) {
    const result = await super.generate(...args);
    return { ...result, provider: "ollama-cloud" as const };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/inference/providers/biged.ts src/lib/inference/providers/ollama-cloud.ts
git commit -m "feat(inference): BigEdProvider (task dispatch) + OllamaCloudProvider"
```

---

### Task 18: InferenceRouter

**Files:**
- Create: `src/lib/inference/router.ts`
- Test: `tests/lib/inference/router.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/inference/router.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("InferenceRouter", () => {
  it("falls through to mock when no providers available", async () => {
    const { InferenceRouter } = await import("@/lib/inference/router");
    const router = new InferenceRouter(); // default providers, none available in test
    const result = await router.generate("test prompt", "system");
    expect(result.provider).toBe("mock");
    expect(result.text.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/inference/router.test.ts
```

- [ ] **Step 3: Write implementation**

Create `src/lib/inference/router.ts`:

```typescript
import type { InferenceProvider, InferenceResult, InferenceOpts } from "./types";
import { BigEdProvider } from "./providers/biged";
import { LocalOllamaProvider } from "./providers/local-ollama";
import { MockProvider } from "./providers/mock";
import { log } from "@/lib/logger";

export class InferenceRouter {
  private providers: InferenceProvider[];

  constructor(providers?: InferenceProvider[]) {
    if (providers) {
      this.providers = providers;
    } else {
      this.providers = [
        new BigEdProvider(),
        new LocalOllamaProvider(),
        // OllamaCloudProvider only if configured
        ...(process.env.OLLAMA_CLOUD_HOST
          ? [new (require("./providers/ollama-cloud").OllamaCloudProvider)()]
          : []),
        new MockProvider(), // always last — always available
      ];
    }
  }

  async generate(
    prompt: string,
    system: string,
    opts?: InferenceOpts
  ): Promise<InferenceResult> {
    for (const provider of this.providers) {
      try {
        if (await provider.available()) {
          log.info({ provider: provider.name }, "Using inference provider");
          return await provider.generate(prompt, system, opts);
        }
      } catch (error) {
        log.warn({ provider: provider.name, error }, "Provider failed, trying next");
      }
    }
    // Should never reach here — MockProvider is always available
    throw new Error("All inference providers failed");
  }

  async status(): Promise<{ providers: Array<{ name: string; available: boolean }> }> {
    const results = await Promise.all(
      this.providers.map(async (p) => ({
        name: p.name,
        available: await p.available().catch(() => false),
      }))
    );
    return { providers: results };
  }
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npx vitest run tests/lib/inference/router.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/inference/router.ts tests/lib/inference/router.test.ts
git commit -m "feat(inference): InferenceRouter with ordered fallback chain"
```

---

### Task 19: Wire BigEdClient + Compliance Profiles

**Files:**
- Modify: `src/lib/biged/client.ts`
- Modify: `src/lib/biged/types.ts`

- [ ] **Step 1: Add compliance profile types**

Add to `src/lib/biged/types.ts`:

```typescript
export interface ComplianceProfile {
  profile_id: string;
  sha256: string;
  stored_at: string;
}

export interface TaskDispatchRequest {
  skill: string;
  payload?: Record<string, unknown>;
  priority?: number;
  assigned_to?: string;
}

export interface TaskDispatchResponse {
  status: "ok";
  task_id: number;
  skill: string;
  priority: number;
}
```

- [ ] **Step 2: Wire BigEdClient methods**

In `src/lib/biged/client.ts`, add/update methods:

```typescript
async submitProfile(data: Record<string, unknown>): Promise<ComplianceProfile> {
  const res = await this.fetch("/api/compliance/profiles", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

async verifyProfile(profileId: string): Promise<{ valid: boolean }> {
  const res = await this.fetch(`/api/compliance/profiles/${profileId}/verify`);
  return res.json();
}

async dispatchTask(request: TaskDispatchRequest): Promise<TaskDispatchResponse> {
  const res = await this.fetch("/api/tasks/dispatch", {
    method: "POST",
    body: JSON.stringify(request),
  });
  return res.json();
}

async ollamaStatus(): Promise<{ running: boolean; loaded_models: string[] }> {
  const res = await this.fetch("/api/ollama/status");
  return res.json();
}

async ollamaStart(): Promise<{ status: string }> {
  const res = await this.fetch("/api/ollama/start", { method: "POST" });
  return res.json();
}
```

Also update the internal `fetch` wrapper to enforce timeouts on all calls. Add a production guard:

```typescript
if (process.env.NODE_ENV === "production" && !this.baseUrl.startsWith("https")) {
  log.warn("biged-rs connection is not HTTPS in production — this is a security risk");
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/biged/client.ts src/lib/biged/types.ts
git commit -m "feat(biged): wire compliance profiles, task dispatch, Ollama management"
```

---

### Task 20: Update Doc Generate Route

**Files:**
- Modify: `src/app/api/docs/generate/route.ts`

- [ ] **Step 1: Add InferenceRouter to generation route**

In `src/app/api/docs/generate/route.ts`, replace direct Ollama calls with InferenceRouter:

```typescript
import { InferenceRouter } from "@/lib/inference/router";

const router = new InferenceRouter();

// In the POST handler, replace ollamaGenerate() calls with:
const result = await router.generate(prompt, systemPrompt, {
  temperature: 0.4,
  maxTokens: 800,
});
// Use result.text instead of the direct Ollama response
```

Keep the existing generation flow structure — just swap the inference call.

- [ ] **Step 2: Test manually**

With biged-rs running on :5555, hit the generate endpoint and verify it routes through BigEdProvider. Then stop biged-rs and verify it falls back to local Ollama or mock.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/docs/generate/route.ts
git commit -m "feat(biged): doc generation uses InferenceRouter with fallback chain"
```

---

## Phase C — Templates + Score Rift

### Task 21: Compliance KB Types

**Files:**
- Create: `src/lib/compliance-kb/types.ts`

- [ ] **Step 1: Write all shared types**

Create `src/lib/compliance-kb/types.ts`:

```typescript
export interface IntakeAnswers {
  [questionId: string]: unknown;
}

export interface Finding {
  gap: string;
  severity: "P0" | "P1" | "P2" | "P3";
  tsc: string;
  remediation: string;
  effort: "hours" | "days" | "weeks";
}

export interface DimensionResult {
  score: number;         // 0.0-1.0
  findings: Finding[];
  strengths: string[];
  confidence: number;    // 0.0-1.0
}

export interface Dimension {
  id: string;
  name: string;
  tsc: string[];
  weight: number;
  evaluate(answers: IntakeAnswers): DimensionResult;
}

export type ReadinessBand =
  | "not-ready"
  | "getting-started"
  | "building-momentum"
  | "almost-there"
  | "audit-ready";

export interface ScoredDimension {
  dimension: Dimension;
  result: DimensionResult;
}

export interface ReadinessScore {
  overall: number;       // 0-100
  band: ReadinessBand;
  dimensions: ScoredDimension[];
  gaps: Finding[];
  strengths: string[];
}

export interface TemplateSection {
  title: string;
  type: "interpolate" | "ai_generate";
  template?: string;
  prompt?: {
    system: string;
    instruction: string;
    requiredContext: string[];
  };
  reviewTag?: boolean;
}

export interface ComplianceTemplate {
  id: string;
  name: string;
  tsc: string[];
  auditRisk: "critical" | "high" | "medium" | "low";
  sections: TemplateSection[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/compliance-kb/types.ts
git commit -m "feat(compliance): shared types for dimensions, findings, templates"
```

---

### Task 22: ScoreEngine

**Files:**
- Create: `src/lib/compliance-kb/engine.ts`
- Test: `tests/lib/compliance-kb/engine.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/compliance-kb/engine.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import type { Dimension, IntakeAnswers } from "@/lib/compliance-kb/types";

describe("ScoreEngine", () => {
  it("computes weighted score from dimensions", async () => {
    const { ScoreEngine } = await import("@/lib/compliance-kb/engine");

    const mockDimension: Dimension = {
      id: "test",
      name: "Test Dimension",
      tsc: ["CC1.1"],
      weight: 1.0,
      evaluate: () => ({
        score: 0.75,
        findings: [],
        strengths: ["Good"],
        confidence: 0.9,
      }),
    };

    const engine = new ScoreEngine([mockDimension]);
    const result = engine.score({});
    expect(result.overall).toBe(75);
    expect(result.band).toBe("almost-there");
    expect(result.strengths).toContain("Good");
  });

  it("aggregates findings from all dimensions", async () => {
    const { ScoreEngine } = await import("@/lib/compliance-kb/engine");

    const dim: Dimension = {
      id: "test",
      name: "Test",
      tsc: ["CC1.1"],
      weight: 1.0,
      evaluate: () => ({
        score: 0.5,
        findings: [
          { gap: "Missing MFA", severity: "P0", tsc: "CC6.1", remediation: "Enable MFA", effort: "hours" },
        ],
        strengths: [],
        confidence: 0.8,
      }),
    };

    const engine = new ScoreEngine([dim]);
    const result = engine.score({});
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0].gap).toBe("Missing MFA");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/compliance-kb/engine.test.ts
```

- [ ] **Step 3: Write implementation**

Create `src/lib/compliance-kb/engine.ts`:

```typescript
import type {
  Dimension,
  IntakeAnswers,
  ReadinessScore,
  ReadinessBand,
  ScoredDimension,
} from "./types";

function toBand(score: number): ReadinessBand {
  if (score >= 80) return "audit-ready";
  if (score >= 60) return "almost-there";
  if (score >= 40) return "building-momentum";
  if (score >= 20) return "getting-started";
  return "not-ready";
}

export class ScoreEngine {
  private dimensions: Dimension[];

  constructor(dimensions: Dimension[]) {
    this.dimensions = dimensions;
  }

  score(answers: IntakeAnswers): ReadinessScore {
    const scored: ScoredDimension[] = this.dimensions.map((d) => ({
      dimension: d,
      result: d.evaluate(answers),
    }));

    const overall = Math.round(
      scored.reduce((sum, s) => sum + s.dimension.weight * s.result.score, 0) * 100
    );

    return {
      overall,
      band: toBand(overall),
      dimensions: scored,
      gaps: scored.flatMap((s) => s.result.findings),
      strengths: scored.flatMap((s) => s.result.strengths),
    };
  }
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npx vitest run tests/lib/compliance-kb/engine.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/compliance-kb/engine.ts tests/lib/compliance-kb/engine.test.ts
git commit -m "feat(compliance): ScoreEngine with weighted dimensions and band mapping"
```

---

### Task 23: SOC 2 Scoring Dimensions (8 dimensions)

**Files:**
- Create: `src/lib/compliance-kb/soc2/dimensions/access-control.ts`
- Create: `src/lib/compliance-kb/soc2/dimensions/system-operations.ts`
- Create: `src/lib/compliance-kb/soc2/dimensions/data-protection.ts`
- Create: `src/lib/compliance-kb/soc2/dimensions/change-management.ts`
- Create: `src/lib/compliance-kb/soc2/dimensions/risk-assessment.ts`
- Create: `src/lib/compliance-kb/soc2/dimensions/vendor-management.ts`
- Create: `src/lib/compliance-kb/soc2/dimensions/hr-training.ts`
- Create: `src/lib/compliance-kb/soc2/dimensions/business-continuity.ts`
- Test: `tests/lib/compliance-kb/dimensions.test.ts`

This is the largest task. Each dimension evaluates specific intake question IDs and returns a score + findings. Reference the existing `gap-detector.ts` for question ID patterns (q2_3, q3_1, q4_1-q4_9, etc.) and `readiness.ts` for the scoring approach.

- [ ] **Step 1: Write test for access-control dimension**

Create `tests/lib/compliance-kb/dimensions.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("access-control dimension", () => {
  it("scores high when MFA is enforced for all", async () => {
    const { accessControl } = await import(
      "@/lib/compliance-kb/soc2/dimensions/access-control"
    );
    const result = accessControl.evaluate({
      q4_1: "enforced_all",        // MFA
      q4_2: "enforced",            // SSO
      q4_3: "implemented",         // RBAC
      q4_4: "quarterly",           // Access reviews
    });
    expect(result.score).toBeGreaterThan(0.7);
    expect(result.findings).toHaveLength(0);
  });

  it("flags P0 when no MFA", async () => {
    const { accessControl } = await import(
      "@/lib/compliance-kb/soc2/dimensions/access-control"
    );
    const result = accessControl.evaluate({
      q4_1: "none",
    });
    expect(result.score).toBeLessThan(0.3);
    expect(result.findings.some((f) => f.severity === "P0")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/compliance-kb/dimensions.test.ts
```

- [ ] **Step 3: Write access-control dimension**

Create `src/lib/compliance-kb/soc2/dimensions/access-control.ts`:

```typescript
import type { Dimension, DimensionResult, Finding, IntakeAnswers } from "../../types";

function evaluate(answers: IntakeAnswers): DimensionResult {
  let score = 0;
  const findings: Finding[] = [];
  const strengths: string[] = [];
  let maxScore = 0;

  // MFA (CC6.1) — 30% of this dimension
  maxScore += 0.3;
  const mfa = answers.q4_1 as string | undefined;
  if (mfa === "enforced_all") {
    score += 0.3;
    strengths.push("MFA enforced for all users");
  } else if (mfa === "enforced_admins") {
    score += 0.15;
    findings.push({
      gap: "MFA only enforced for admins, not all users",
      severity: "P1",
      tsc: "CC6.1",
      remediation: "Extend MFA requirement to all user accounts via SSO provider",
      effort: "days",
    });
  } else {
    findings.push({
      gap: "No MFA enforcement",
      severity: "P0",
      tsc: "CC6.1",
      remediation: "Enable MFA for all users. Start with admin accounts, then roll out org-wide",
      effort: "days",
    });
  }

  // SSO (CC6.1) — 20%
  maxScore += 0.2;
  const sso = answers.q4_2 as string | undefined;
  if (sso === "enforced" || sso === "available") {
    score += 0.2;
    strengths.push("SSO available for authentication");
  } else {
    findings.push({
      gap: "No SSO implementation",
      severity: "P1",
      tsc: "CC6.1",
      remediation: "Implement SSO via Google Workspace, Okta, or Azure AD",
      effort: "weeks",
    });
  }

  // RBAC (CC6.3) — 25%
  maxScore += 0.25;
  const rbac = answers.q4_3 as string | undefined;
  if (rbac === "implemented" || rbac === "documented") {
    score += 0.25;
    strengths.push("Role-based access controls implemented");
  } else {
    findings.push({
      gap: "No formal role-based access control",
      severity: "P1",
      tsc: "CC6.3",
      remediation: "Define roles with least-privilege access, document in access control policy",
      effort: "weeks",
    });
  }

  // Access reviews (CC6.2) — 25%
  maxScore += 0.25;
  const reviews = answers.q4_4 as string | undefined;
  if (reviews === "quarterly" || reviews === "monthly") {
    score += 0.25;
    strengths.push("Regular access reviews conducted");
  } else if (reviews === "annually") {
    score += 0.1;
    findings.push({
      gap: "Access reviews only conducted annually",
      severity: "P2",
      tsc: "CC6.2",
      remediation: "Increase access review frequency to quarterly minimum",
      effort: "hours",
    });
  } else {
    findings.push({
      gap: "No formal access review process",
      severity: "P1",
      tsc: "CC6.2",
      remediation: "Establish quarterly access review process with documented evidence",
      effort: "days",
    });
  }

  const confidence = Object.keys(answers).filter((k) =>
    ["q4_1", "q4_2", "q4_3", "q4_4"].includes(k)
  ).length / 4;

  return { score: maxScore > 0 ? score / maxScore : 0, findings, strengths, confidence };
}

export const accessControl: Dimension = {
  id: "access_control",
  name: "Access Control (CC6.1-6.8)",
  tsc: ["CC6.1", "CC6.2", "CC6.3", "CC6.6", "CC6.7", "CC6.8"],
  weight: 0.20,
  evaluate,
};
```

- [ ] **Step 4: Write remaining 7 dimensions**

Follow the same pattern for each. Key intake question mappings:

| Dimension | Questions | TSC |
|-----------|-----------|-----|
| system-operations | q2_3 (monitoring), q2_5 (deployment) | CC7.1-7.4 |
| data-protection | q3_1 (encryption), q3_4 (classification) | CC6.1, C1.1-1.2 |
| change-management | q4_5 (change process), q4_6 (testing) | CC8.1 |
| risk-assessment | q4_7 (risk methodology) | CC3.1-3.4 |
| vendor-management | q4_8 (vendor reviews) | CC9.2 |
| hr-training | q4_9 (security training) | CC1.4 |
| business-continuity | q6_1 (DR plan), q6_2 (backup) | A1.2-A1.3 |

Each file exports a `Dimension` object with an `evaluate()` function.

- [ ] **Step 5: Run tests, verify pass**

```bash
npx vitest run tests/lib/compliance-kb/dimensions.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/compliance-kb/soc2/dimensions/ tests/lib/compliance-kb/dimensions.test.ts
git commit -m "feat(compliance): 8 SOC 2 scoring dimensions with intake-driven evaluation"
```

---

### Task 24: SOC 2 Compliance Templates (14 templates)

**Files:**
- Create: 14 template files under `src/lib/compliance-kb/soc2/templates/`
- Test: `tests/lib/compliance-kb/templates.test.ts`

- [ ] **Step 1: Write test**

Create `tests/lib/compliance-kb/templates.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("compliance templates", () => {
  it("exports 14 templates", async () => {
    const { soc2Templates } = await import("@/lib/compliance-kb/soc2/templates");
    expect(soc2Templates).toHaveLength(14);
  });

  it("each template has required fields", async () => {
    const { soc2Templates } = await import("@/lib/compliance-kb/soc2/templates");
    for (const t of soc2Templates) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.tsc.length).toBeGreaterThan(0);
      expect(t.sections.length).toBeGreaterThan(0);
      expect(["critical", "high", "medium", "low"]).toContain(t.auditRisk);
    }
  });

  it("system-description template has AI generate sections", async () => {
    const { soc2Templates } = await import("@/lib/compliance-kb/soc2/templates");
    const sysDesc = soc2Templates.find((t) => t.id === "system-description");
    expect(sysDesc).toBeDefined();
    expect(sysDesc!.auditRisk).toBe("critical");
    const aiSections = sysDesc!.sections.filter((s) => s.type === "ai_generate");
    expect(aiSections.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/compliance-kb/templates.test.ts
```

- [ ] **Step 3: Write templates**

Each template is a TypeScript file exporting a `ComplianceTemplate`. Write all 14, starting with the 5 critical/high templates (these get full AI sections with auditor-grade prompt context). Templates 6-14 get structured skeletons.

Create an index file `src/lib/compliance-kb/soc2/templates/index.ts`:

```typescript
import type { ComplianceTemplate } from "../../types";
import { systemDescription } from "./system-description";
import { informationSecurityPolicy } from "./information-security-policy";
import { incidentResponsePlan } from "./incident-response-plan";
import { accessControlPolicy } from "./access-control-policy";
import { changeManagementPolicy } from "./change-management-policy";
import { riskAssessment } from "./risk-assessment";
import { dataClassification } from "./data-classification";
import { businessContinuityDr } from "./business-continuity-dr";
import { vendorManagementPolicy } from "./vendor-management-policy";
import { encryptionPolicy } from "./encryption-policy";
import { acceptableUsePolicy } from "./acceptable-use-policy";
import { securityAwarenessTraining } from "./security-awareness-training";
import { auditLogReview } from "./audit-log-review";
import { accessReviewTemplates } from "./access-review-templates";

export const soc2Templates: ComplianceTemplate[] = [
  systemDescription,
  informationSecurityPolicy,
  incidentResponsePlan,
  accessControlPolicy,
  changeManagementPolicy,
  riskAssessment,
  dataClassification,
  businessContinuityDr,
  vendorManagementPolicy,
  encryptionPolicy,
  acceptableUsePolicy,
  securityAwarenessTraining,
  auditLogReview,
  accessReviewTemplates,
];
```

Example critical template — `system-description.ts`:

```typescript
import type { ComplianceTemplate } from "../../types";

export const systemDescription: ComplianceTemplate = {
  id: "system-description",
  name: "System Description",
  tsc: ["DC200"],
  auditRisk: "critical",
  sections: [
    {
      title: "Company Overview",
      type: "interpolate",
      template:
        "{{companyName}} is a {{industry}} company with approximately {{employeeCount}} employees. {{aiDescription}}",
    },
    {
      title: "System Boundaries and Infrastructure",
      type: "ai_generate",
      prompt: {
        system:
          "You are writing a SOC 2 system description per AICPA Description Criteria (DC 200). Auditors read this first and test everything against it. Use precise language. Only reference infrastructure the company actually operates. Do not include aspirational statements.",
        instruction:
          "Describe the system boundaries, infrastructure components, and data flows based on the company's intake responses. Include: cloud providers, deployment pipeline, network architecture, and data storage locations.",
        requiredContext: [
          "cloudProviders",
          "deploymentPipeline",
          "dataFlows",
          "networkArchitecture",
          "dataStorage",
        ],
      },
      reviewTag: true,
    },
    {
      title: "Principal Service Commitments",
      type: "ai_generate",
      prompt: {
        system:
          "Write the principal service commitments section of a SOC 2 system description. This describes what the company promises its customers regarding security, availability, and confidentiality.",
        instruction:
          "Based on the company's industry, size, and service offerings, describe the principal service commitments and system requirements.",
        requiredContext: ["industry", "companySize", "serviceDescription"],
      },
      reviewTag: true,
    },
    {
      title: "Relevant Aspects of the Control Environment",
      type: "ai_generate",
      prompt: {
        system:
          "Describe the control environment as required by AICPA DC 200. Cover: organizational structure, board/management oversight, HR policies, and communication channels.",
        instruction:
          "Describe the control environment based on the company's size, governance structure, and HR practices.",
        requiredContext: ["companySize", "hrPolicies", "securityTraining"],
      },
      reviewTag: true,
    },
  ],
};
```

Write all 14 template files following this pattern. The 5 critical/high templates should each have 3-6 sections with a mix of interpolate and ai_generate. Templates 6-14 can have 2-3 sections each.

- [ ] **Step 4: Run tests, verify pass**

```bash
npx vitest run tests/lib/compliance-kb/templates.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/compliance-kb/soc2/templates/ tests/lib/compliance-kb/templates.test.ts
git commit -m "feat(compliance): 14 SOC 2 document templates with AI generation prompts"
```

---

### Task 25: Auditor Guidance Files

**Files:**
- Create: `src/lib/compliance-kb/soc2/guidance/auditor-expectations.ts`
- Create: `src/lib/compliance-kb/soc2/guidance/common-findings.ts`
- Create: `src/lib/compliance-kb/soc2/guidance/remediation-paths.ts`

- [ ] **Step 1: Write guidance files**

These are structured data files that the AI prompt context references. Example:

Create `src/lib/compliance-kb/soc2/guidance/auditor-expectations.ts`:

```typescript
export const auditorExpectations: Record<string, string> = {
  "system-description":
    "Auditors read the system description first and test everything against it. Common test: compare the described infrastructure to actual evidence (screenshots, configs). The description must be accurate — aspirational language triggers findings.",
  "information-security-policy":
    "Auditors verify the ISP covers all 5 trust service categories. They check that stated controls match operational evidence. Most common finding: policy says 'quarterly access reviews' but no evidence of reviews.",
  "incident-response-plan":
    "Auditors test IR by reviewing incident logs and comparing response to the documented plan. They look for: defined roles, escalation procedures, communication templates, and post-incident review process.",
  // ... one entry per template
};
```

Create similar files for `common-findings.ts` (frequent audit failures per template) and `remediation-paths.ts` (per-gap fix with effort estimate).

- [ ] **Step 2: Commit**

```bash
git add src/lib/compliance-kb/soc2/guidance/
git commit -m "feat(compliance): auditor guidance — expectations, common findings, remediation paths"
```

---

### Task 26: Compliance KB Index + Public API

**Files:**
- Create: `src/lib/compliance-kb/index.ts`

- [ ] **Step 1: Write the public API**

Create `src/lib/compliance-kb/index.ts`:

```typescript
export { ScoreEngine } from "./engine";
export { soc2Templates } from "./soc2/templates";
export { auditorExpectations } from "./soc2/guidance/auditor-expectations";
export { commonFindings } from "./soc2/guidance/common-findings";
export { remediationPaths } from "./soc2/guidance/remediation-paths";

// Import all dimensions
import { accessControl } from "./soc2/dimensions/access-control";
import { systemOperations } from "./soc2/dimensions/system-operations";
import { dataProtection } from "./soc2/dimensions/data-protection";
import { changeManagement } from "./soc2/dimensions/change-management";
import { riskAssessment } from "./soc2/dimensions/risk-assessment";
import { vendorManagement } from "./soc2/dimensions/vendor-management";
import { hrTraining } from "./soc2/dimensions/hr-training";
import { businessContinuity } from "./soc2/dimensions/business-continuity";

export const soc2Dimensions = [
  accessControl,
  systemOperations,
  dataProtection,
  changeManagement,
  riskAssessment,
  vendorManagement,
  hrTraining,
  businessContinuity,
];

// Pre-configured engine for SOC 2
import { ScoreEngine } from "./engine";
export const soc2Engine = new ScoreEngine(soc2Dimensions);
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/compliance-kb/index.ts
git commit -m "feat(compliance): public API — soc2Engine, templates, guidance exports"
```

---

### Task 27: Server-Side Scoring Endpoint

**Files:**
- Create: `src/app/api/intake/score/route.ts`

- [ ] **Step 1: Write the scoring endpoint**

Create `src/app/api/intake/score/route.ts`:

```typescript
import { withAuth } from "@/lib/auth/middleware";
import { verifyOwnership } from "@/lib/auth/session-ownership";
import { soc2Engine } from "@/lib/compliance-kb";
import { db } from "@/db";
import { intakeAnswers } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = withAuth(async (req, session) => {
  const { sessionId } = await req.json();

  if (!(await verifyOwnership(sessionId, session.userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Load all answers for this session
  const answers = await db.query.intakeAnswers.findMany({
    where: eq(intakeAnswers.sessionId, sessionId),
  });

  // Convert to key-value map
  const answerMap: Record<string, unknown> = {};
  for (const a of answers) {
    answerMap[a.questionId] = a.value;
  }

  const score = soc2Engine.score(answerMap);

  return Response.json(score);
});
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/intake/score/route.ts
git commit -m "feat(compliance): server-side /api/intake/score endpoint with auth"
```

---

### Task 28: Generated Documents Migration + Storage

**Files:**
- Create: `drizzle/0003_generated_documents.sql`
- Modify: `src/db/schema.ts` (add generatedDocuments table)

- [ ] **Step 1: Add table to schema**

Add to `src/db/schema.ts`:

```typescript
export const generatedDocuments = pgTable("generated_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => intakeSessions.id),
  userId: uuid("user_id").references(() => users.id),
  templateId: text("template_id").notNull(),
  status: text("status").notNull().default("generating"),
  sections: jsonb("sections").notNull(),
  scoreSnapshot: jsonb("score_snapshot"),
  bigedProfileId: text("biged_profile_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
```

- [ ] **Step 2: Generate and apply migration**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat(compliance): generated_documents table with RLS"
```

---

### Task 29: Final Integration — Wire Generation Pipeline

**Files:**
- Modify: `src/app/api/docs/generate/route.ts`

- [ ] **Step 1: Update generation route to use compliance templates + scoring**

In the POST handler, add the compliance template path:

```typescript
import { soc2Templates, soc2Engine } from "@/lib/compliance-kb";
import { InferenceRouter } from "@/lib/inference/router";
import { db } from "@/db";
import { generatedDocuments } from "@/db/schema";

const router = new InferenceRouter();

// Check for ComplianceTemplate first
const complianceTemplate = soc2Templates.find((t) => t.id === templateId);

if (complianceTemplate) {
  // New path: compliance-aware generation
  const score = soc2Engine.score(answerMap);

  const sections = [];
  for (const section of complianceTemplate.sections) {
    if (section.type === "interpolate") {
      sections.push({
        title: section.title,
        content: interpolate(section.template!, companyProfile),
        type: "interpolate",
      });
    } else {
      const prompt = buildPrompt(section.prompt!, answerMap, score, companyProfile);
      const result = await router.generate(prompt, section.prompt!.system);
      sections.push({
        title: section.title,
        content: result.text,
        type: "ai_generate",
        reviewTag: section.reviewTag,
        provider: result.provider,
      });
    }
  }

  // Persist to DB
  const [doc] = await db.insert(generatedDocuments).values({
    sessionId,
    userId: session.userId,
    templateId,
    status: "review",
    sections: JSON.stringify(sections),
    scoreSnapshot: JSON.stringify(score),
  }).returning();

  return Response.json({ document: { id: doc.id, sections, score } });
} else {
  // Fallback: existing DocTemplate + mockProse path (demo mode)
  // ... existing code unchanged
}
```

- [ ] **Step 2: Test end-to-end**

1. With biged-rs running: verify task dispatch works
2. Without biged-rs: verify fallback to local Ollama or mock
3. Demo path: verify /demo still works with mockProse

- [ ] **Step 3: Commit**

```bash
git add src/app/api/docs/generate/route.ts
git commit -m "feat(compliance): generation pipeline uses ComplianceTemplate + InferenceRouter"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] `npx vitest run` — all tests pass
- [ ] `npm run build` — builds without errors
- [ ] Demo path works: `localhost:3000/demo` loads, generates mock docs
- [ ] OAuth login works (when env vars configured): redirect, callback, session created
- [ ] Magic link works: POST /api/auth/magic-link, POST /api/auth/verify
- [ ] Protected routes return 401 without session
- [ ] Session claim works: anonymous session -> login -> claim -> ownership enforced
- [ ] InferenceRouter falls through: biged-rs -> local Ollama -> mock
- [ ] ScoreEngine produces 0-100 scores with gap findings
- [ ] Doc generation uses ComplianceTemplate when available
- [ ] Generated documents persist to PostgreSQL

---

## Known Limitations & Deferred Items

**Rate limiter (Task 10):** The in-memory `Map` rate limiter works for single-instance / local dev but resets on cold start in serverless deployments. For production on Vercel, replace with Upstash or Vercel KV. Acceptable for launch.

**SSE for task progress:** Phase A uses polling (2s interval) in BigEdProvider v1. The spec calls for SSE via `events.ts` — defer to a follow-up task once polling is validated end-to-end.

**Template ID matching:** ComplianceTemplate IDs (e.g. `data-classification`) must match existing DocTemplate IDs from `src/lib/doc-gen/templates/`. During Task 24, cross-reference the existing template index to ensure IDs align. If they differ, update the Task 29 lookup to check both ID formats.

**LUCIA_SECRET env var:** Lucia v3 does not use a separate signing secret — it relies on cookie attributes (httpOnly, secure, sameSite). Remove from spec env vars or repurpose if a custom HMAC layer is added later.

**Cross-phase security hardening (from spec):** The following items from the spec's "Security Hardening" section are not in this plan and should be done as a separate task before going public:
- `.gitignore` expansion (certs, keys, SQLite files)
- `SECURITY.md` creation (responsible disclosure)
- `.github/workflows/security.yml` (Semgrep, npm audit, gitleaks)
- `.github/dependabot.yml` (weekly dependency updates)
