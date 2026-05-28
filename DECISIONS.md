# Architecture Decisions

## Phase 1 Decisions

### D-001: Project Root
Project is built directly in `AuraOne/` (the existing directory) rather than a nested `skmc-cmms/` subfolder, since `.gitignore` / `.env.example` were already present.

### D-002: next-intl "without routing" mode
**Problem:** `next-intl` with `localePrefix: "as-needed"` rewrites paths internally (e.g., `/login` → `/th/login`), causing 404s because there's no `[locale]` folder in the App Router structure.  
**Decision:** Use next-intl in "manual" mode — no `createMiddleware`, locale is read from the `NEXT_LOCALE` cookie (set by `LanguageSwitcher`) or `Accept-Language` header. The `getRequestConfig` in `i18n/request.ts` handles locale detection.  
**Trade-off:** Cannot use next-intl's auto-redirects for locale changes; user must click the language toggle. This is fine for a factory app where Thai is always default.

### D-003: Auth split for Edge Runtime
NextAuth v5's `authorized` callback in `middleware.ts` runs in Edge Runtime, which cannot use Node.js modules (Prisma, bcrypt).  
**Decision:** Split into `auth.config.ts` (edge-safe — no providers, just JWT/session callbacks) and `auth.ts` (full Node.js — has Credentials provider with Prisma query + bcrypt). Middleware imports only `auth.config.ts`.

### D-004: Tailwind v4 + CSS Variables
Tailwind v4 uses `@import "tailwindcss"` in CSS and PostCSS plugin `@tailwindcss/postcss`. No `tailwind.config.ts` needed.  
All semantic colors are plain CSS custom properties (`--brand`, `--success`, etc.) in `:root` and `[data-theme=dark]`. Tailwind arbitrary values (`bg-[var(--brand)]`) or inline `style` props are used for dynamic colors.  
**Trade-off:** Less Tailwind intellisense for custom tokens vs. full design system flexibility.

### D-005: Dark mode via `data-theme` attribute
Used `[data-theme=dark]` CSS selector (not Tailwind's `.dark` class) because the Tailwind v4 `@variant` declaration uses `[data-theme=dark]`.  
Theme toggle writes `data-theme` to `<html>` and persists in `localStorage`.

### D-006: pnpm build scripts
pnpm 11.x moved `onlyBuiltDependencies` from `package.json#pnpm` to `pnpm.yaml`. The Prisma client is generated manually via `node_modules/.bin/prisma generate` in the CI/setup step, not auto-run on install.  
**Action needed:** After fresh `pnpm install`, run: `node_modules/.bin/prisma generate`

### D-007: bcryptjs over argon2
Used `bcryptjs` (pure JS) instead of argon2 to avoid native compilation issues on macOS ARM during development. Can swap to argon2 in production.

### D-008: Recharts v3
Upgraded from spec's v2 to v3 (v2 deprecated). The tooltip `formatter` type changed slightly in v3 — see `dashboard-charts.tsx` for the correct type.

### D-009: PostgreSQL user
Development DB URL uses the macOS system username (`pisitsak.kr`) as the PostgreSQL user (default peer auth on macOS Homebrew). The `.env.example` shows `postgres` — update for production.
