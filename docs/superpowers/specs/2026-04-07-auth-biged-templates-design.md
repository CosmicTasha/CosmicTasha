# CosmicTasha — Auth + biged-rs Integration + Compliance Templates

## Status: APPROVED — 2026-04-07
## Owner: Max

---

## Overview

Three integrated workstreams that share types and interfaces, built in dependency order:

1. **Phase B — Auth & Security Foundation** (Lucia + Arctic + security hardening)
2. **Phase A — biged-rs Integration** (inference routing, compliance profiles, task dispatch)
3. **Phase C — Templates + Score Rift** (14 compliance templates, 8 scoring dimensions, generation pipeline)

biged-rs is the platform for inference and LLM tasks (full control, no black-box third parties). CosmicTasha is a client that degrades gracefully when biged-rs is unavailable (demo mode already proves this).

---

## Security Baseline (Pre-Build Audit)

Audit conducted 2026-04-07. Key findings driving this design:

| Severity | Finding | Fix Phase |
|----------|---------|-----------|
| P0 | No auth on any intake endpoint | B |
| P0 | Auth system exists but never called | B |
| P0 | No RLS in PostgreSQL | B |
| P0 | No tenant context flows to DB | B |
| P0 | Tier enforcement is client-side localStorage | B |
| P1 | Session enumeration via UUID guessing | B |
| P1 | Magic link token in URL query param | B |
| P1 | biged-rs connection over plain HTTP | A |
| P1 | No rate limiting on any endpoint | B |
| P1 | No CSRF protection | B |

Positive: crypto fundamentals solid, Drizzle ORM prevents SQLi, no unsafe HTML injection patterns, .env not in git, Caddy TLS good, deps current.

---

## Phase B — Auth & Security Foundation

### Architecture

```
Browser -- cookie --> Next.js Middleware (auth guard)
                         |
                    +----------+
                    |getSession| validates cookie against DB
                    +----+-----+
                         |
              +----------+----------+
              v          v          v
         Public      Anonymous   Authenticated
         routes      routes      routes
         (landing,   (intake     (intake CRUD,
          pricing,    create,    docs, profile,
          terms)      templates) settings)
```

### Auth Stack

| Layer | Tech | Role |
|-------|------|------|
| OAuth flows | Arctic (Google, GitHub, Microsoft/Entra ID) | Token exchange, PKCE, callback handling |
| Sessions | Lucia | Cookie-based sessions, DB-backed, 30-day TTL |
| Magic link | Existing (refined) | Fallback when OAuth not configured |
| Email | EmailProvider interface | ConsoleProvider (dev) / ResendProvider (prod) |

### New Files

```
src/lib/auth/
  lucia.ts              # Lucia adapter setup (PostgreSQL via Drizzle)
  arctic.ts             # OAuth provider configs (Google, GitHub, Microsoft)
  middleware.ts          # Route protection: public / anon / authenticated
  session-ownership.ts  # Verify requestor owns the session they are touching
  email/
    provider.ts         # EmailProvider interface
    console.ts          # ConsoleProvider (logs to stdout)
    resend.ts           # ResendProvider (API key from env)

src/app/api/auth/
  login/google/route.ts       # OAuth initiate
  login/github/route.ts
  login/microsoft/route.ts
  callback/google/route.ts    # OAuth callback
  callback/github/route.ts
  callback/microsoft/route.ts
  magic-link/route.ts         # Existing, refined (token in POST body, not URL)
  verify/route.ts             # Changed to POST (no more token in query string)
  session/route.ts            # Existing
```

### Security Fixes

| Finding | Fix |
|---------|-----|
| No auth on intake endpoints | middleware.ts — all /api/intake/* except POST /session require valid Lucia session |
| Auth exists but unused | Replace custom auth with Lucia; getSession() called in middleware, not per-route |
| No RLS | New migration: ENABLE ROW LEVEL SECURITY + policies on all intake tables keyed to user_id |
| No tenant context | Middleware sets app.current_user_id on DB connection; RLS enforces it |
| Tier in localStorage | New subscriptions table; getTier() queries DB, never trusts client |
| Token in URL | Magic link verify changes to POST /api/auth/verify with token in body |
| No rate limiting | Next.js middleware rate-limits auth endpoints (5/email/hour, 10/IP/min on verify) |
| No CSRF | SameSite=Lax on Lucia cookies (required for OAuth callbacks) + Origin header validation + CSRF tokens on state-changing POSTs |

### Session Ownership Model

**Anonymous session (pre-signup):**
- Created via POST /api/intake/session, returns sessionId
- Stored in localStorage (current behavior)
- Session row has userId = NULL
- Protected by session token opacity only (UUID v4)
- Accessed via a **service-role DB connection** that bypasses RLS (anonymous routes only)

**Post-login claim (two paths):**

Path A — claim by localStorage sessionId (single session):
```
1. User authenticates (OAuth or magic link)
2. Frontend sends POST /api/auth/claim-session { sessionId } from localStorage
3. Backend: UPDATE intakeSessions SET userId = ? WHERE id = ? AND userId IS NULL
4. If 0 rows affected: session was already claimed → return 409 Conflict
5. Frontend shows "This session belongs to another account" + option to start fresh
```

Path B — claim by email invite (potentially multiple sessions):
```
1. User authenticates with email matching a pending invite
2. Backend: SELECT id FROM intake_invites WHERE email = ? AND status = 'pending'
3. For each invite: UPDATE intakeSessions SET userId = ? WHERE id = invite.sessionId AND userId IS NULL
4. Mark invites as 'accepted'
5. If 0 rows affected on any: skip silently (invite was stale or already claimed)
```

**Authenticated CRUD:**
- Middleware extracts userId from Lucia session
- Every DB query filters by userId via Drizzle `.where()` clauses (primary enforcement)
- RLS enforces same filter at DB layer (defense in depth for direct DB access)
- Neon serverless note: RLS uses `SET LOCAL` inside explicit transactions to ensure `app.current_user_id` does not leak across pooled connections

### Email Provider Interface

```typescript
interface EmailProvider {
  sendMagicLink(email: string, token: string, url: string): Promise<void>;
  sendScoringComplete(email: string, jobId: string, score: number): Promise<void>;
}
```

Swap via `EMAIL_PROVIDER=console|resend` env var. Resend needs `RESEND_API_KEY`.

### Lucia Session Table Migration

The existing `sessions` table uses custom fields. Lucia v3 requires specific columns.
Migration approach: **in-place ALTER** (no active production sessions to preserve):

```sql
-- Adapt existing sessions table for Lucia v3
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS fresh BOOLEAN DEFAULT true;
-- Lucia uses text IDs (already the case), expiresAt (already exists), userId (already exists)
-- No data migration needed — no production sessions exist yet
```

If column types conflict, drop and recreate (pre-launch, no user data at risk).

### OAuth Accounts Table

Lucia + Arctic require a linked accounts table for multi-provider support:

```sql
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,              -- 'google' | 'github' | 'microsoft'
  provider_account_id TEXT NOT NULL,   -- provider's unique user ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);
CREATE INDEX idx_oauth_accounts_user ON oauth_accounts(user_id);
```

One user can link multiple providers. Login checks oauth_accounts first, falls back to magic link.

### New Migration (Phase B)

```sql
-- Subscriptions (server-side tier enforcement)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tier TEXT NOT NULL DEFAULT 'discovery',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OAuth accounts
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);

-- RLS on all intake tables
-- Note: anonymous sessions are accessed via service-role connection (bypasses RLS).
-- RLS only applies to authenticated operations.
ALTER TABLE intake_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_sessions_select ON intake_sessions
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::uuid);
CREATE POLICY user_sessions_update ON intake_sessions
  FOR UPDATE USING (user_id = current_setting('app.current_user_id', true)::uuid);
CREATE POLICY user_sessions_insert ON intake_sessions
  FOR INSERT WITH CHECK (true);  -- anyone can create a session

ALTER TABLE intake_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_answers_select ON intake_answers
  FOR SELECT USING (session_id IN (
    SELECT id FROM intake_sessions
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  ));
CREATE POLICY user_answers_modify ON intake_answers
  FOR ALL USING (session_id IN (
    SELECT id FROM intake_sessions
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  ));

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_profiles ON company_profiles
  FOR ALL USING (session_id IN (
    SELECT id FROM intake_sessions
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  ));

ALTER TABLE gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_gaps ON gaps
  FOR ALL USING (session_id IN (
    SELECT id FROM intake_sessions
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  ));
```

**RLS implementation note:** Uses `current_setting('app.current_user_id', true)` (the `true` returns NULL instead of error if unset). Anonymous routes use a service-role connection that bypasses RLS entirely. Authenticated routes use `SET LOCAL app.current_user_id = '...'` inside explicit transactions to prevent leakage across Neon's pooled connections. Primary enforcement is Drizzle `.where()` clauses; RLS is defense-in-depth.

### Dimension Migration

The existing `gaps` table has a 5-value enum. Phase C adds 3 new dimensions. Migration:

```sql
-- Convert dimension column from enum to TEXT (or add new values)
-- Existing values: access_control, data_protection, operational_readiness, change_management, documentation
-- New values: system_operations, risk_assessment, vendor_management, hr_training, business_continuity
-- Mapping: operational_readiness splits into system_operations + business_continuity
--          documentation is absorbed into each dimension's findings
ALTER TABLE gaps ALTER COLUMN dimension TYPE TEXT;
```

### Env Vars (Phase B)

```env
# OAuth (all optional — omit to disable that provider)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=

# Lucia
LUCIA_SECRET=             # Required — session cookie signing key

# Email (optional — defaults to console)
EMAIL_PROVIDER=console
RESEND_API_KEY=
```

---

## Phase A — biged-rs Integration

### Connection Architecture

```
CosmicTasha (Next.js)
    |
    +-- BigEdClient (server-side only, never browser)
    |   +-- healthCheck()     -> GET  /api/health
    |   +-- submitProfile()   -> POST /api/compliance/profiles
    |   +-- verifyProfile()   -> GET  /api/compliance/profiles/{id}/verify
    |   +-- dispatchTask()    -> POST /api/tasks/dispatch
    |   +-- getTask()         -> GET  /api/tasks (poll by id)
    |   +-- ollamaStatus()    -> GET  /api/ollama/status
    |   +-- ollamaStart()     -> POST /api/ollama/start
    |
    +-- SSE listener          -> GET  /api/stream (task progress, real-time)
    |
    +-- InferenceRouter (new)
        +-- bigedrs()         -> POST /api/tasks/dispatch {skill: "inference"}
        +-- local()           -> Ollama direct (current behavior)
        +-- cloud()           -> Ollama Cloud (same API, different OLLAMA_HOST)
        +-- mock()            -> mockProse (demo fallback, always works)
```

### InferenceRouter

Single entry point implementing doc 19's fallback chain:

```typescript
interface InferenceProvider {
  name: string;
  available(): Promise<boolean>;
  generate(prompt: string, system: string, opts: InferenceOpts): Promise<InferenceResult>;
}

interface InferenceResult {
  text: string;
  model: string;
  provider: string;       // "biged-rs" | "local-ollama" | "ollama-cloud" | "mock"
  duration_ms: number;
}
```

Provider priority: biged-rs -> local Ollama -> Ollama Cloud -> mockProse.

Each provider has a health check. Router tries in order, falls back on failure. Mock always succeeds (demo mode).

### Compliance Profile Storage

On intake completion:

```
POST /api/compliance/profiles {answers, gaps, score}
  -> biged-rs returns {profile_id, sha256, stored_at}
  -> CosmicTasha stores profile_id in intakeSessions row

GET /api/compliance/profiles/{id}/verify
  -> confirms integrity (sha256 match)
  -> append-only audit log entry created automatically
```

### Doc Generation via Task Dispatch

```
POST /api/docs/generate (CosmicTasha route)
  -> InferenceRouter checks biged-rs availability
  -> If UP: dispatchTask({skill: "doc_generate", payload: {templateId, answers, companyProfile}})
    -> biged-rs returns {task_id, status: "PENDING"}
    -> SSE listener on /api/stream for task_updated events
    -> When DONE: fetch result, store in PostgreSQL, return to client
  -> If DOWN: fall back to local generation (current synchronous behavior)
```

### Graceful Degradation

| Feature | biged-rs UP | biged-rs DOWN |
|---------|-------------|---------------|
| Inference | Fleet task dispatch | Local Ollama / mockProse |
| Profile storage | SHA-256 verified in biged-rs | Stored in PostgreSQL only |
| Ollama management | biged-rs starts/stops models | Direct Ollama API |
| Health display | Real fleet status | "Offline" badge, demo continues |
| Doc generation | Async fleet task + SSE progress | Synchronous local generation |

### New/Modified Files

```
src/lib/biged/
  client.ts             # Wire up unused methods, add TLS validation, timeouts
  types.ts              # Add compliance profile types
  hooks.ts              # Add useInferenceStatus()
  events.ts             # SSE listener for task progress

src/lib/inference/
  router.ts             # InferenceRouter with fallback chain
  providers/
    biged.ts            # BigEdProvider — dispatch via fleet tasks
    local-ollama.ts     # LocalOllamaProvider (refactored from current)
    ollama-cloud.ts     # OllamaCloudProvider (same API, different host)
    mock.ts             # MockProvider (current mockProse extracted)
  types.ts              # InferenceProvider interface, InferenceResult
```

### biged-rs Endpoint Prerequisites

These biged-rs endpoints already exist (verified in audit):
- GET /api/health, GET /api/status, GET /api/stream (SSE)
- POST /api/tasks/dispatch, GET /api/tasks (with filtering)
- POST /api/compliance/profiles, GET /api/compliance/profiles/{id}/verify
- GET /api/ollama/status, POST /api/ollama/start, POST /api/ollama/stop

No new biged-rs endpoints need to be built. Phase A is purely client-side wiring.

Note: existing BigEdClient uses `POST /api/tasks` (legacy endpoint). Update to `POST /api/tasks/dispatch` (preferred, supports priority 1-10 and assigned_to).

### Env Vars (Phase A)

```env
BIGED_URL=http://localhost:5555        # HTTP for local dev; HTTPS required in prod
OLLAMA_CLOUD_HOST=                     # Empty = disabled
OLLAMA_CLOUD_KEY=                      # Ollama Cloud API key
```

---

## Phase C — Templates + Score Rift

### Compliance Knowledge Base Structure

SOC 2 only for v1. ISO 27001 / HIPAA follow later per doc 08 sequencing.

```
src/lib/compliance-kb/
  soc2/
    dimensions/            # 8 scoring dimensions
      access-control.ts        # CC6.1-6.8 — 20% weight
      system-operations.ts     # CC7.1-7.4 — 15%
      data-protection.ts       # CC6.1, C1.1-1.2 — 15%
      change-management.ts     # CC8.1 — 10%
      risk-assessment.ts       # CC3.1-3.4 — 10%
      vendor-management.ts     # CC9.2 — 10%
      hr-training.ts           # CC1.4 — 10%
      business-continuity.ts   # A1.2-A1.3 — 10%

    templates/             # 14 doc templates
      system-description.ts          # Priority 1 — Critical
      information-security-policy.ts # Priority 2 — Critical
      incident-response-plan.ts      # Priority 3 — High
      access-control-policy.ts       # Priority 4 — High
      change-management-policy.ts    # Priority 5 — High
      risk-assessment.ts             # Priority 6 — Medium-High
      data-classification.ts         # Priority 7 — Medium
      business-continuity-dr.ts      # Priority 8 — Medium
      vendor-management-policy.ts    # Priority 9 — Medium
      encryption-policy.ts           # Priority 10 — Low-Medium
      acceptable-use-policy.ts       # Priority 11 — Low
      security-awareness-training.ts # Priority 12 — Low
      audit-log-review.ts            # Priority 13 — Low
      access-review-templates.ts     # Priority 14 — Low

    guidance/              # AI prompt context
      auditor-expectations.ts  # What auditors test per control
      common-findings.ts       # Frequent audit failures
      remediation-paths.ts     # Per-gap fix with effort estimates

  engine.ts                  # ScoreEngine — runs dimensions, produces ReadinessScore
  types.ts                   # All shared types
  index.ts                   # Public API
```

### Scoring Dimensions

Each dimension is a pure function: intake answers in, score + findings out.

```typescript
interface Dimension {
  id: string;                    // e.g. "access_control"
  name: string;                  // "Access Control (CC6.1-6.8)"
  tsc: string[];                 // ["CC6.1", "CC6.2", ...]
  weight: number;                // 0.20
  evaluate(answers: IntakeAnswers): DimensionResult;
}

interface DimensionResult {
  score: number;                 // 0.0-1.0
  findings: Finding[];           // gaps detected
  strengths: string[];           // what is already solid
  confidence: number;            // 0.0-1.0 (low if intake data sparse)
}

interface Finding {
  gap: string;                   // "No MFA enforcement"
  severity: "P0" | "P1" | "P2" | "P3";
  tsc: string;                   // "CC6.1"
  remediation: string;           // "Enable MFA for all users via SSO provider"
  effort: "hours" | "days" | "weeks";
}
```

### ScoreEngine

Replaces client-side calculateReadiness() and detectGaps():

```typescript
class ScoreEngine {
  private dimensions: Dimension[];

  score(answers: IntakeAnswers): ReadinessScore {
    const results = this.dimensions.map(d => ({
      dimension: d,
      result: d.evaluate(answers),
    }));

    const overall = results.reduce(
      (sum, r) => sum + r.dimension.weight * r.result.score, 0
    ) * 100;

    return {
      overall,                          // 0-100 weighted composite
      band: toBand(overall),            // "Getting Started" | "Almost There" | "Audit Ready"
      dimensions: results,
      gaps: results.flatMap(r => r.result.findings),
      strengths: results.flatMap(r => r.result.strengths),
    };
  }
}
```

Runs server-side. Can be dispatched to biged-rs as a fleet task for heavy workloads.

### Template Structure

```typescript
interface ComplianceTemplate {
  id: string;
  name: string;                  // "Information Security Policy"
  tsc: string[];                 // TSC criteria this doc satisfies
  auditRisk: "critical" | "high" | "medium" | "low";
  sections: TemplateSection[];
}

interface TemplateSection {
  title: string;
  type: "interpolate" | "ai_generate";
  template?: string;             // For interpolate: "{{companyName}} is a {{industry}} company..."
  prompt?: {                     // For ai_generate:
    system: string;              //   From guidance/auditor-expectations
    instruction: string;         //   What to generate
    requiredContext: string[];    //   Which intake answers to inject
  };
  reviewTag?: boolean;           // If true, output marked [REVIEW] for HITL
}
```

Templates 1-5 (critical/high audit risk) get full AI generation sections. Templates 6-14 get structured skeletons with interpolation and simpler AI sections.

**Type system note:** The existing `DocTemplate` uses `type: 'static' | 'ai_generate' | 'conditional'`. The new `ComplianceTemplate` uses `type: 'interpolate' | 'ai_generate'`. This is a **parallel type system**, not a replacement. The existing 14 template files at `src/lib/doc-gen/templates/` with their mockProse generators remain as the fallback layer. `ComplianceTemplate` adds structured compliance metadata (TSC mappings, audit risk, prompt context) on top. The generation pipeline checks for a `ComplianceTemplate` first; if none exists for a given template ID, it falls back to the existing `DocTemplate` + mockProse path.

### Generation Flow

```
Intake complete
    |
    v
ScoreEngine.score(answers)
    -> ReadinessScore { overall: 68, gaps: [...], dimensions: [...] }
    |
    v
For each selected template:
    +-- Interpolate sections: fill {{placeholders}} from intake answers
    +-- AI sections: build prompt from
    |   +-- template.prompt.system (auditor expectations)
    |   +-- template.prompt.instruction
    |   +-- intake answers (filtered by requiredContext)
    |   +-- relevant gaps from ScoreEngine
    |   +-- company profile
    +-- InferenceRouter.generate(prompt)
    |   -> biged-rs task dispatch (preferred)
    |   -> local Ollama (fallback)
    |   -> mockProse (demo)
    +-- Mark [REVIEW] tags on AI-generated sections
    |
    v
GeneratedDocument stored in PostgreSQL
    -> compliance profile submitted to biged-rs for SHA-256 verification
```

### Changes to Existing Code

| Current | After |
|---------|-------|
| lib/readiness.ts (client-side) | Replaced by compliance-kb/engine.ts (server-side) |
| lib/gap-detector.ts + gap-generator.ts | Replaced by dimension evaluate() functions |
| lib/doc-gen/generator.ts | Extended to call InferenceRouter for AI sections |
| lib/doc-gen/templates/ (empty) | Populated with 14 compliance templates |
| In-memory documentStore Map | PostgreSQL generated_documents table |
| app/intake/results/page.tsx (client-side scoring) | Calls server API, receives pre-computed score |

### New Migration (Phase C)

```sql
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES intake_sessions(id),
  user_id UUID REFERENCES users(id),
  template_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generating',
  sections JSONB NOT NULL,
  score_snapshot JSONB,
  biged_profile_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_docs ON generated_documents
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);
-- Anonymous/demo document generation stays in-memory (existing documentStore Map).
-- Only authenticated users get persistent doc storage in this table.
```

---

## Build Order Summary

### Phase B — Auth & Security (~2 hours)
1. Install Lucia + Arctic + Resend SDK
2. Lucia adapter (PostgreSQL/Drizzle)
3. Arctic OAuth providers (Google, GitHub, Microsoft)
4. OAuth routes (login + callback x 3 providers)
5. Refine magic link (POST verify, token in body)
6. EmailProvider interface + ConsoleProvider + ResendProvider
7. Auth middleware (route protection)
8. Session ownership validation
9. RLS migration
10. Subscriptions table + server-side getTier()
11. Rate limiting on auth endpoints
12. CSRF: SameSite=Strict + Origin validation

### Phase A — biged-rs Integration (~2 hours)
1. Wire BigEdClient methods (compliance profiles, task dispatch, Ollama mgmt)
2. Add TLS validation + timeouts to BigEdClient
3. InferenceRouter + 4 providers (biged, local, cloud, mock)
4. SSE listener for task progress
5. Update /api/docs/generate to use task dispatch with fallback
6. Update /api/biged/status to include inference router status
7. Compliance profile submission on intake completion

### Phase C — Templates + Score Rift (~2 hours)
1. Types (Dimension, Finding, ReadinessScore, ComplianceTemplate, etc.)
2. 8 scoring dimensions with evaluate() functions
3. ScoreEngine
4. 5 critical templates (full AI sections)
5. 9 remaining templates (structured skeletons)
6. Auditor guidance files (expectations, common findings, remediation)
7. Generation pipeline (template + InferenceRouter + persistent storage)
8. generated_documents migration
9. Update results page to use server-side scoring
10. Wire generation flow through biged-rs task dispatch

---

## Demo Path Preservation

The demo path (localhost:3000/demo -> NovaBridge seed -> results) MUST stay functional throughout all three phases. Every new dependency has a fallback:

| Dependency | Fallback |
|------------|----------|
| Lucia auth | Demo bypasses auth (anonymous session, no login required) |
| biged-rs | InferenceRouter falls through to mockProse |
| PostgreSQL | Demo uses localStorage (current behavior) |
| OAuth providers | Magic link still works; demo does not require login |
| Resend email | ConsoleProvider logs to stdout |
| Score Rift dimensions | ScoreEngine works locally, no external deps |

---

## Open Questions (Deferred)

- Score Rift compliance preset: inline in CosmicTasha repo (this spec) vs separate scorerift plugin — decided inline for now, extract later if needed
- Ollama Cloud compliance posture verification — needed before routing customer data, not before build
- HIPAA/ISO 27001 templates — Phase 2, after SOC 2 templates are validated
- Compliance partner onboarding — Month 3+, per doc 11 phasing
