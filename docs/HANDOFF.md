# Handoff State — SKMC CMMS

> Current as of commit `0238a5d` (2026-05-28). All four phases complete.

## Git History

```
0238a5d  fix(reports): raw SQL BigInt serialization + alias ORDER BY
55f66b4  feat(phase4): reports, QR, CSV export, WO parts, notification count
5cfdeaa  feat(phase3): admin CRUD, spare parts, PM→WO, bug fixes
c981c38  docs: add AI_CONTEXT, ARCHITECTURE, DECISIONS, HANDOFF, TODO
afbbb7e  feat(phase2): core modules — Asset Registry, Work Orders, PM Schedule, Calibration
1391e8a  feat(phase1): foundation — Next.js 15 + Tailwind 4 + Prisma + Auth + Layout shell
```

---

## Full Feature Status

### Asset Registry

| Feature | Status | Notes |
|---|---|---|
| `/assets/machines` list | ✅ | Status tabs, search, create modal |
| `/assets/molds` list | ✅ | Shot count / mold life column |
| `/assets/it` list | ✅ | IP, OS columns |
| `/assets/instruments` list | ✅ | Cal status + next date |
| `/assets/[id]` detail | ✅ | Info, machine specs, WOs, PMs, cals, spare parts BOM |
| Edit asset button | ✅ | Pre-filled modal on detail page |
| QR code popup + print | ✅ | Opens `qrcode.react` dialog, prints to new tab with label |
| Create asset | ✅ | Category-specific fields, dept→section cascade |
| Delete asset | ❌ | Soft-delete field exists in schema, no UI |
| QR scan (camera) | ❌ | `html5-qrcode` installed, scan UI not built |

### Work Orders

| Feature | Status | Notes |
|---|---|---|
| `/work-orders` list | ✅ | Status tabs, search, CSV export |
| `/work-orders/[id]` detail | ✅ | Full metadata, cost sidebar, failure codes |
| Create WO modal | ✅ | Asset search, type/priority/assignee |
| WO number (atomic) | ✅ | `UPDATE...RETURNING` — no race condition |
| Status transitions | ✅ | OPEN→IN_PROGRESS→DONE/ON_HOLD, CANCELLED |
| WO close dialog | ✅ | Captures laborHours, failure/cause/action codes |
| Checklist items | ✅ | PENDING→PASS→FAIL→NA, optimistic UI |
| Add/remove parts | ✅ | `WOPartsPanel`, deducts stock, recalculates cost |
| Approval workflow | ❌ | `Workflow`/`WorkflowStep` models seeded; engine not built |
| File attachments | ❌ | `WOAttachment` model exists; no storage wired |
| Mold shot count on close | ❌ | No UI to increment `Asset.shotCount` |

### PM Schedule

| Feature | Status | Notes |
|---|---|---|
| `/pm-schedule` list | ✅ | Overdue/due-soon tabs, days countdown, 8 seeded plans |
| Create PM plan | ✅ | Asset search, frequency, checklist template |
| Generate WOs button | ✅ | `generatePMWorkOrders()` — copies checklist, advances nextDueDate |
| PM calendar view | ❌ | Not planned |
| Usage-based PM (shots) | ❌ | Schema supports it; trigger logic missing |

### Calibration

| Feature | Status | Notes |
|---|---|---|
| `/calibration` list | ✅ | 10 instruments, cal status computed live |
| Record calibration | ✅ | Auto-fills next date from period, updates asset |
| calStatus auto-update | ✅ | **Computed at query time** — no stale data |
| Certificate file upload | ❌ | `certFileUrl` field exists; no storage |

### Spare Parts

| Feature | Status | Notes |
|---|---|---|
| `/spare-parts` list | ✅ | Low-stock tab, search, CSV export |
| Create/edit part | ✅ | Unit, supplier, shelf, reorder point |
| Stock adjust dialog | ✅ | +/- with preview, reason field |
| WO parts deduction | ✅ | `addPartToWO` checks stock, updates `totalPartsCost` |
| Stock movements log | ❌ | No audit trail for stock changes |
| Purchase orders | ❌ | Not planned |

### Reports

| Feature | Status | Notes |
|---|---|---|
| `/reports` — KPI strip | ✅ | WO counts, MTBF, MTTR, availability |
| WO by month chart | ✅ | 12-month stacked bar, CM vs PM vs others |
| Top bad actors | ✅ | Horizontal bar + detail table with rank badges |
| Cost by department | ✅ | Stacked bar, labor + parts, 12 months |
| PM compliance trend | ✅ | Line chart with 80% target reference line |
| Calibration status | ✅ | Donut pie with OVERDUE/DUE_SOON/NORMAL tiles |
| Export PDF/Excel | ❌ | Only CSV on WO list + spare parts |
| Custom date ranges | ❌ | Fixed 12-month window |

### Admin Panel

| Page | Status |
|---|---|
| `/admin` hub | ✅ — grid of links |
| `/admin/users` | ✅ — full CRUD, bcrypt password, active toggle |
| `/admin/roles` | ✅ — read-only list (system roles) |
| `/admin/departments` | ✅ — tree with inline section CRUD |
| `/admin/areas` | ✅ — full CRUD with delete |
| `/admin/wo-types` | ✅ — CRUD with color picker |
| `/admin/priorities` | ✅ — CRUD with SLA hours |
| `/admin/asset-classes` | ✅ — CRUD, category/criticality |
| `/admin/calibration-labs` | ✅ — CRUD |
| `/admin/suppliers` | ✅ — CRUD with active toggle |
| `/admin/notification-rules` | ✅ — list + toggle + add rule |
| `/admin/workflow-designer` | ❌ — placeholder, not built |
| `/admin/checklist-templates` | ❌ — placeholder, not built |

### Other

| Feature | Status | Notes |
|---|---|---|
| Notification bell count | ✅ | Real DB count seeded from layout server component |
| CSV export | ✅ | WO list + spare parts, Thai header + BOM for Excel |
| Dark mode | ✅ | All CSS vars — verified working throughout |
| Thai / English locale | ✅ | Cookie-based switch, TH default |
| Sidebar collapse | ✅ | Persisted to localStorage |

---

## Remaining Gaps (True Production Blockers)

These are the only items that would block real factory deployment:

| Gap | Why it blocks | Effort |
|---|---|---|
| File storage (attachments, cal certs) | WOs and calibrations need document attachments | Medium — wire S3 or local storage |
| Approval workflow engine | WOs route around approval steps | Large — step-by-step state machine |
| Notification delivery | Bell shows count, events don't create notifications | Medium — add `createNotification()` calls at mutation points |
| Production env (DB, secrets, domain) | No `pnpm build` has been run | Small — env vars + `pnpm build` |
| Checklist template builder | Admin can't create new templates | Medium — drag-sort item list |
| Mold shot count tracking | PM trigger on shots never fires | Small-Medium |

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
pnpm dev                               # Turbopack dev server (:3000 or :3001)
pnpm type-check                        # tsc --noEmit
pnpm db:migrate                        # prisma migrate dev
node_modules/.bin/tsx prisma/seed.ts   # seed (use this, not pnpm db:seed)
node_modules/.bin/prisma generate      # regenerate client after schema change
node_modules/.bin/prisma studio        # GUI at localhost:5555
```

## Test Users (all password: `skmc1234`)

| Email | Role |
|---|---|
| admin@skmc.co.th | SYSTEM_ADMIN |
| manager@skmc.co.th | MAINTENANCE_MANAGER |
| supervisor@skmc.co.th | MAINTENANCE_SUPERVISOR |
| tech1@skmc.co.th | DEPT_TECHNICIAN |
| tech2@skmc.co.th | DEPT_TECHNICIAN |

## Seed Data Summary

| Entity | Count |
|---|---|
| Machines | 10 (SK-P-001…SK-P-010) |
| Molds | 5 (J-C-001…J-C-005) |
| IT assets | 5 (PCD-AC-01, PCD-WS-01…03) |
| Instruments | 10 (PG, LC, TC, VC, MC series) |
| PM plans | 8 (with real nextDueDate) |
| Work Orders | 3 sample (1 DONE, 1 OPEN, 1 IN_PROGRESS) |
| Spare parts | 8 (hydraulic, bearing, grease, sensor, filter…) |
| Users | 5 |
| Calibration labs | 4 (SP-METRO, PCAL, KAWATA, GOSHU) |
