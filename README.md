# CosmicTasha

AI-native SOC 2 compliance document generation, with a human-in-the-loop review gate.

CosmicTasha walks an organization through an intake flow, scores readiness across the SOC 2 trust criteria, generates draft policies and procedures from a Jinja2 template library, and routes every generated artifact through a reviewer before it leaves the system.

> **Status:** Alpha (`v0.1.0`). Schemas, templates, and the public API may change between minor versions until `v1.0.0`.

## What's in this repo

|Path|What it is|
|----|----------|
|[`web/`](web/)|Next.js 16 App Router app — intake flow, dashboard, HITL review gate, billing|
|[`templates/`](templates/)|Jinja2 compliance document templates (14 SOC 2 documents)|
|[`skills/`](skills/)|Python skills invoked over the inference bridge|
|[`scripts/`](scripts/)|Setup, calibration, deployment, and dev-environment scripts|
|[`deploy/`](deploy/)|Caddy reverse-proxy config and deployment helpers|
|[`ray_scorer_prototype.py`](ray_scorer_prototype.py)|Reference implementation of the ScoreRift readiness scorer|
|[`docker-compose.yml`](docker-compose.yml)|Production stack: Caddy + Next.js + Postgres + Redis|
|[`docker-compose.dev.yml`](docker-compose.dev.yml)|Dev dependencies only (Postgres + Redis)|

## Architecture

```text
┌─────────────────────────┐                  ┌──────────────────────────┐
│  Next.js (web/)         │  HTTPS / WSS     │  biged-rs                │
│  App Router + API       │ ───────────────▶ │  axum REST + SSE + WS    │
│  Intake · Dashboard     │                  │  AI routing · doc gen    │
│  HITL review gate       │ ◀─────────────── │  gap analysis · sanitize │
└────────────┬────────────┘                  └─────────────┬────────────┘
             │                                             │
             ▼                                             ▼
   ┌─────────────────┐                          ┌──────────────────┐
   │  PostgreSQL 16  │                          │  Ollama (local)  │
   │  per-tenant RLS │                          │  Gemma / Qwen    │
   └─────────────────┘                          └──────────────────┘
```

- **Frontend + web API** — Next.js App Router (TypeScript, Tailwind, shadcn/ui), Drizzle ORM, Lucia auth
- **Inference service** — `biged-rs` (Rust, axum) handles AI routing, document generation, gap analysis, and output sanitization. Lives in a separate repository.
- **Database** — PostgreSQL 16 with per-tenant schema isolation for paid tenants and row-level security on the shared free-tier schema
- **Local AI** — Ollama (default model: Qwen 3 8B) with a fallback chain to hosted providers
- **Real-time** — WebSockets for collaborative review sessions

### Architecture decisions

The full ADR set lives in [`docs/`](docs/). Highlights:

- **ADR-001** — Next.js App Router with shadcn/ui
- **ADR-002** — Next.js API Routes (web) + biged-rs (AI/doc service)
- **ADR-003** — PostgreSQL with per-tenant schema isolation
- **ADR-004** — Hybrid AI: local Ollama first, hosted-model fallback
- **ADR-005** — Jinja2 templates + AI prose → Markdown intermediate → PDF/DOCX
- **ADR-006** — Lucia auth (self-hosted) with tiered SSO
- **ADR-007** — WebSockets for collaboration from day one
- **ADR-008** — ScoreRift scoring algorithm open (Apache 2.0); calibrated weights kept private

## Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose
- A running [Ollama](https://ollama.ai) instance (for local inference) or hosted model credentials
- Access to a running `biged-rs` service — see [biged-rs requirement](#biged-rs-requirement) below

## Quick start (development)

```bash
# 1. Bring up Postgres + Redis
docker compose -f docker-compose.dev.yml up -d

# 2. Install web dependencies
cd web
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL, BIGED_URL, AUTH_SECRET, OLLAMA_URL

# 4. Run database migrations
npm run db:push

# 5. Start the dev server
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

The web app reads these from `.env.local` (see [`web/.env.example`](web/.env.example)):

|Variable|Purpose|Example|
|--------|-------|-------|
|`DATABASE_URL`|PostgreSQL connection string|`postgresql://cosmictasha:devpassword@localhost:5432/cosmictasha`|
|`BIGED_URL`|biged-rs service endpoint|`https://localhost:5555`|
|`AUTH_SECRET`|Session signing key — **change in production**|(random 32+ char string)|
|`BASE_URL`|Public origin used in callbacks|`http://localhost:3000`|
|`OLLAMA_URL`|Ollama HTTP endpoint|`http://localhost:11434`|
|`OLLAMA_MODEL`|Default Ollama model tag|`qwen3:8b`|

## Production deployment

```bash
# Copy and edit env
cp .env.example .env
# At minimum set: DB_PASSWORD, AUTH_SECRET, BIGED_URL, BASE_URL

docker compose up -d
```

The stack includes Caddy for automatic HTTPS termination — edit [`deploy/Caddyfile`](deploy/) for your domain.

> **Do not deploy with default secrets.** `docker-compose.yml` falls back to `changeme` / `change-in-production` if `DB_PASSWORD` and `AUTH_SECRET` are unset. Set both before exposing to the network.

## biged-rs requirement

CosmicTasha does not embed inference logic — it talks to `biged-rs` (a separate Rust service) over an authenticated HTTPS/WSS connection. `biged-rs` is not yet publicly released. Until it is, running the full stack requires either working with the maintainers to obtain access, or implementing a service that satisfies the wire protocol used by [`web/src/lib/inference`](web/src/lib/) (REST + SSE + WS).

The web app degrades gracefully when `BIGED_URL` is unreachable — you can still walk the intake flow and explore the UI, but doc generation and live AI features will be disabled.

## Scoring algorithm

The readiness scorer (ScoreRift) is open source and lives at [`ray_scorer_prototype.py`](ray_scorer_prototype.py). It is licensed under Apache 2.0 along with the rest of this repository.

Calibrated production weights are not included in this repository.

## Security

See [SECURITY.md](SECURITY.md) for the disclosure policy and supported versions.

## License

Apache License 2.0 — see [LICENSE](LICENSE).
