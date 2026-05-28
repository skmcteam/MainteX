# Contributing to MainteX

## Prerequisites

- Node.js 22+
- pnpm 11+
- PostgreSQL 15+ (running locally)

## Dev Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env and fill required values
cp .env.example .env
# AUTH_SECRET → run: openssl rand -base64 32
# DATABASE_URL → replace <your-pg-user> with your local PostgreSQL username

# 3. Create database and run migrations
createdb skmc_cmms
pnpm db:migrate

# 4. Seed sample data
pnpm db:seed

# 5. Start dev server
pnpm dev   # → http://localhost:3000
```

Login: `admin@skmc.co.th` / `skmc1234`

## Key Commands

```bash
pnpm dev            # Dev server with Turbopack
pnpm build          # Production build (must pass before PR)
pnpm type-check     # TypeScript strict check
pnpm db:migrate     # Run pending migrations
pnpm db:seed        # Re-seed sample data
pnpm db:studio      # Prisma Studio (database browser)
pnpm db:reset       # Reset + re-migrate (DESTROYS DATA)
```

## Architecture Quick Reference

See `docs/AI_CONTEXT.md` for a full orientation. Key patterns:

**Server pages** — `async function Page()`, `export const dynamic = "force-dynamic"`, fetch data at top, pass serialized plain objects to client components (no Prisma types on the wire).

**Server actions** — `"use server"`, validate with zod, call `revalidatePath()`, return `{ success: true }` or throw.

**Client components** — `"use client"`, call `router.refresh()` after mutation, use `sonner` toast for feedback.

**CSS** — Use `style={{ color: "var(--text)" }}` not Tailwind color utilities. Use `className="panel-border"` for cards, `className="row-hover"` on clickable table rows.

**i18n** — All user-visible strings must use `useTranslations()`. Add missing keys to both `messages/en.json` and `messages/th.json`. Locale comes from the `NEXT_LOCALE` cookie — no URL prefixes.

**Prisma Decimal / Date serialization** — Server Actions must call `Number(r.field)` on Decimal fields and `.toISOString()` on Date fields before returning to the client.

## Three Critical Gotchas

1. **next-intl has no routing middleware.** Never add `createMiddleware` or locale URL prefixes. See `i18n/request.ts`.

2. **Auth is split for Edge Runtime.** `lib/auth.config.ts` is edge-safe (no Prisma). `lib/auth.ts` has the full provider. Never import `lib/auth.ts` from `middleware.ts`.

3. **Workflow Designer is Phase 5 stub.** The designer saves config but `lib/workflow-engine.ts` functions throw — they are not yet wired to Work Orders. Do not call them in production code until Phase 5.

## PR Conventions

- One logical change per commit; use conventional commit prefixes: `feat:`, `fix:`, `perf:`, `refactor:`, `chore:`, `docs:`, `style:`, `a11y:`, `i18n:`
- `pnpm build` must pass — no new TypeScript errors
- New server actions: validate with zod, include `revalidatePath()`
- New client-facing strings: add to both `messages/en.json` and `messages/th.json`
- Schema changes: create a new migration (`pnpm db:migrate`), never edit existing ones
- No direct pushes to `master` — open a PR

## Database

```
postgresql://<your-pg-user>@localhost:5432/skmc_cmms
```

Staging uses Docker Compose (`docker compose -f docker-compose.staging.yml up`).
