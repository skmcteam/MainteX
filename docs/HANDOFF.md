# Handoff State — SKMC CMMS

> Current as of commit `afbbb7e` (2026-05-28). Describes exactly what exists, what works, and what doesn't.

## Git History

```
afbbb7e  feat(phase2): core modules — Asset Registry, Work Orders, PM Schedule, Calibration
1391e8a  feat(phase1): foundation — Next.js 15 + Tailwind 4 + Prisma + Auth + Layout shell
```

---

## Completed & Working

### Phase 1 — Foundation (`1391e8a`)

- Next.js 15 App Router project with route groups `(app)` / `(auth)`
- Tailwind CSS v4 with full CSS custom properties design system (light + dark mode)
- Prisma schema: 30+ models covering Assets, WorkOrders, PMPlans, Calibrations, SpareParts, Notifications, Workflows, AuditLog
- NextAuth v5 JWT auth: Credentials provider, bcrypt, edge-safe middleware split
- next-intl i18n: Thai default, English via cookie (no URL routing)
- Collapsible sidebar + responsive topbar + mobile bottom nav (5 items)
- Dashboard with live KPIs: open WOs, active assets, cal overdue, PM compliance, MTBF, MTTR, availability, downtime hours
- Asset status pie chart (Recharts)
- Zustand stores: sidebar collapse (persisted), notifications (placeholder)
- Database seed: all reference data + 10 machines, 5 molds, 5 IT assets, 10 instruments, 3 sample WOs, 8 spare parts

### Phase 2 — Core Modules (`afbbb7e`)

#### Asset Registry

| Feature | Status | Notes |
|---|---|---|
| `/assets/machines` list | ✅ Live | 10 rows, status tabs, search, create modal |
| `/assets/molds` list | ✅ Live | Shot count column |
| `/assets/it` list | ✅ Live | Standard columns |
| `/assets/instruments` list | ✅ Live | Cal status + next date columns |
| `/assets/[id]` detail | ✅ Live | Info + related WOs/PMs/cals/spare parts |
| Create asset modal | ✅ Live | Category-specific fields, dept→section cascade |
| Edit asset | ❌ Missing | `updateAsset()` action exists, UI does not |

#### Work Orders

| Feature | Status | Notes |
|---|---|---|
| `/work-orders` list | ✅ Live | Status tabs, priority/type badges, search |
| `/work-orders/[id]` detail | ✅ Live | Full metadata, status actions, cost sidebar |
| Create WO modal | ✅ Live | Asset search, type/priority/assignee |
| WO number generation | ✅ Live | `WO-{YY}{MM}-{####}` from WONumberSeries |
| Status transitions | ✅ Live | OPEN→IN_PROGRESS→DONE/ON_HOLD, CANCELLED |
| Checklist items | ✅ Live | PENDING→PASS→FAIL→NA with optimistic UI |
| Close WO with cost/codes | ❌ Missing | Direct status change, no completion dialog |
| Approval workflow | ❌ Missing | Models exist, engine not implemented |
| Add parts to WO | ❌ Missing | WOSparePart model exists, UI does not |
| File attachments | ❌ Missing | Model + storage not configured |

#### PM Schedule

| Feature | Status | Notes |
|---|---|---|
| `/pm-schedule` list | ✅ Live | Overdue/due-soon tabs, days countdown |
| Create PM plan modal | ✅ Live | Asset search, frequency, template, assignee |
| Auto-generate WOs from PM | ❌ Missing | Core PM logic not implemented |
| PM calendar view | ❌ Missing | Mentioned in nav but not planned for Phase 3 |

#### Calibration

| Feature | Status | Notes |
|---|---|---|
| `/calibration` list | ✅ Live | 10 instruments, cal status, "บันทึกผล" button |
| Record calibration modal | ✅ Live | Auto-fills nextCalDate from period |
| calStatus auto-update | ❌ Missing | Goes stale — must compute at query time |

---

## Placeholder Pages (Shell Only)

These routes render empty Phase placeholders. All need Phase 3 implementation:

```
/spare-parts
/reports
/admin                      (hub)
/admin/users
/admin/roles
/admin/workflow-designer
/admin/wo-types
/admin/priorities
/admin/asset-classes
/admin/departments
/admin/sections
/admin/areas
/admin/checklist-templates
/admin/calibration-labs
/admin/suppliers
/admin/notification-rules
```

---

## Known Bugs

| # | Bug | Severity | File |
|---|---|---|---|
| 1 | WO number series race condition (read-then-write) | Medium | `work-orders/actions.ts:createWorkOrder` |
| 2 | `calStatus` stale after date passes | Medium | `calibration/actions.ts:getCalibrationAssets` |
| 3 | PM plans in seed have no `nextDueDate` | Low | `prisma/seed.ts` |
| 4 | No edit button on asset detail page | Low | `assets/[id]/page.tsx` |
| 5 | WO completion has no cost/failure code capture UI | Low | `wo-status-actions.tsx` |

---

## Environment

```bash
# .env (local dev)
DATABASE_URL="postgresql://pisitsak.kr@localhost:5432/skmc_cmms"
AUTH_SECRET="<secret>"
NEXTAUTH_URL="http://localhost:3000"
```

## Dev Commands

```bash
pnpm dev                               # Turbopack dev server
pnpm type-check                        # tsc --noEmit
pnpm db:migrate                        # prisma migrate dev
node_modules/.bin/tsx prisma/seed.ts   # seed (use this, not pnpm db:seed)
node_modules/.bin/prisma generate      # regenerate client after schema change
node_modules/.bin/prisma studio        # GUI browser at localhost:5555
```

## Test Users (all password: `skmc1234`)

| Email | Role |
|---|---|
| admin@skmc.co.th | SYSTEM_ADMIN |
| manager@skmc.co.th | MAINTENANCE_MANAGER |
| supervisor@skmc.co.th | MAINTENANCE_SUPERVISOR |
| tech1@skmc.co.th | DEPT_TECHNICIAN |
| tech2@skmc.co.th | DEPT_TECHNICIAN |

---

## What to Do Next (Phase 3 Starting Point)

The most impactful first tasks, in order:

1. **Fix calStatus computation** — in `getCalibrationAssets()`, replace the stored `r.calStatus` with a computed value based on `r.nextCalDate` vs `new Date()`. Eliminates the stale-data bug without schema changes.

2. **Add PM nextDueDate to seed** — update `prisma/seed.ts` to calculate `nextDueDate` for each PM plan so the schedule page shows real dates.

3. **Admin: Users CRUD** — highest business value admin page. Pattern is identical to the asset create modal; use `bcrypt.hash` in the server action.

4. **WO completion dialog** — small change to `wo-status-actions.tsx`: when clicking "เสร็จสิ้น", open a small Radix Dialog asking for laborHours, failureCode, causeCode, actionCode, notes before calling `updateWOStatus`.

5. **Spare parts inventory** — needed for WO parts tracking. Build the list first, then add stock adjustment, then wire into WO detail.
