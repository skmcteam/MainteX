# AI Context — MainteX

> Fast orientation for a new AI session. Read this first, then ARCHITECTURE.md for depth.

## What This Is

A production-grade **Computerized Maintenance Management System (CMMS)** for SKMC factory in Thailand. Manages 1,850 assets, 10,800+ spare parts, preventive maintenance scheduling, work order lifecycle, and calibration tracking. Primary UI language is Thai (TH default), English available via cookie switch.

## Repo Location

```
/Users/pisitsak.kr/Documents/MainteX/
```

## Dev Server

```bash
pnpm dev          # runs on :3000 (or :3001 if port in use)
```

Login: `admin@skmc.co.th` / `skmc1234`

## Tech Stack (exact versions)

| Layer | Tech |
|---|---|
| Framework | Next.js 15.3.3, App Router, Turbopack |
| Language | TypeScript 5.8, strict mode |
| Styling | Tailwind CSS v4, CSS custom properties (`var(--brand)`, etc.) |
| Database | PostgreSQL via Prisma 6.9 |
| Auth | NextAuth v5 beta (JWT strategy, Credentials provider) |
| i18n | next-intl 3.26, no URL routing — locale in `NEXT_LOCALE` cookie |
| Forms | react-hook-form + zod |
| Modals | @radix-ui/react-dialog |
| Toasts | sonner |
| State | Zustand (sidebar collapse, notifications) |
| Charts | Recharts |
| Dates | date-fns v4, date-fns-tz, Asia/Bangkok timezone |
| Package mgr | pnpm 11 |

## Database

```
postgresql://pisitsak.kr@localhost:5432/skmc_cmms
```
macOS peer auth — user is `pisitsak.kr`, NOT `postgres`.

## Phase Status

| Phase | Status | Commit |
|---|---|---|
| Phase 1 — Foundation | ✅ Done | `1391e8a` |
| Phase 2 — Core Modules | ✅ Done | `afbbb7e` |
| Phase 3 — Admin & Master Data | ✅ Done | `5cfdeaa` |
| Phase 4 — Polish & Reports | ✅ Done | `0238a5d` |
| Remaining gaps | 🔲 Optional | See HANDOFF.md |

## The Three Must-Know Gotchas

1. **next-intl has NO routing middleware** — locale comes from `NEXT_LOCALE` cookie only. Do NOT add `createMiddleware` or locale prefixes to URLs. See `i18n/request.ts`.

2. **Auth is split for Edge Runtime** — `lib/auth.config.ts` is edge-safe (no Prisma, no bcrypt), used in `middleware.ts`. `lib/auth.ts` has the full Credentials provider with Prisma. Never import `lib/auth.ts` in middleware.

3. **Prisma Decimal serialization** — Server Actions that return Decimal fields must convert with `Number(r.field)` before returning to client. Dates must be `.toISOString()`. Both rules are followed in all existing `actions.ts` files — do the same for any new ones.

## Key Files to Know

```
app/(app)/layout.tsx              ← auth guard + Toaster + real notification count
app/(app)/dashboard/              ← KPI dashboard (MTBF, MTTR, PM compliance, charts)
app/(app)/assets/actions.ts       ← asset CRUD + getAssetFormData
app/(app)/work-orders/actions.ts  ← WO CRUD, status transitions, atomic WO#, parts management
app/(app)/pm-schedule/actions.ts  ← PM plan CRUD + generatePMWorkOrders()
app/(app)/calibration/actions.ts  ← recordCalibration, calStatus computed live
app/(app)/spare-parts/actions.ts  ← inventory CRUD, adjustStock, addPartToWO/removePartFromWO
app/(app)/admin/actions.ts        ← all master data CRUD (users, depts, types, labs, suppliers…)
app/(app)/reports/actions.ts      ← analytics: getWOByMonth, getTopBadActors, getCostByDepartment…
app/globals.css                   ← CSS custom properties + .panel-border, .row-hover, .form-input
lib/utils.ts                      ← formatDate, formatCurrency, generateWONumber, daysUntil
lib/csv.ts                        ← downloadCSV() — client-side CSV with Thai BOM
lib/kpi.ts                        ← computeKPIs (MTBF/MTTR/availability)
components/admin/admin-table.tsx  ← shared admin table (search, CRUD actions)
components/admin/admin-crud-client.tsx ← generic modal wiring for all admin pages
components/admin/simple-form-modal.tsx ← field-config driven modal
prisma/schema.prisma              ← source of truth for all models
prisma/seed.ts                    ← all reference data + sample assets/WOs/PM plans
```

## Pattern Summary (follow exactly)

- **Server pages** = `async function Page()` with `export const dynamic = "force-dynamic"` + data fetch at top, pass serialized plain objects to client components
- **Server actions** = `"use server"`, validate with zod, use `revalidatePath()`, return `{ success: true }` or throw
- **Client components** = `"use client"`, use `router.refresh()` after mutation, use `sonner` toast for feedback
- **CSS** = always use `style={{ color: "var(--text)" }}` not Tailwind color classes; use `className="panel-border"` for cards; use `className="row-hover"` on clickable rows
- **Forms in modals** = react-hook-form + zodResolver + Radix Dialog + `"use client"` + call server action in `onSubmit`
