# TODO — MainteX

> Updated 2026-05-29. Phases 1–4 complete. Phase 5 = Workflow Engine.

---

## ✅ Resolved — closed 2026-05-29

| Item | Resolution |
|------|-----------|
| ~~P3-1 · WO Number Series race condition~~ | Fixed — `createWorkOrder()` uses `$queryRaw UPDATE...RETURNING` (atomic) |
| ~~P3-2 · calStatus goes stale~~ | Fixed — `computeCalStatus()` calculates from `nextCalDate` vs `new Date()` at query time |
| ~~P3-3 · Users CRUD~~ | Done — `/admin/users` with full CRUD + bcrypt + active toggle |
| ~~P3-5 · Departments / Sections / Areas CRUD~~ | Done — pages + actions in `admin/actions.ts` |
| ~~P3-6 · Asset Classes CRUD~~ | Done — `/admin/asset-classes` |
| ~~P3-7 · WO Types & Priorities CRUD~~ | Done — `/admin/wo-types`, `/admin/priorities` |
| ~~P3-8 · Checklist Template Builder~~ | Done — list + `@dnd-kit` item builder |
| ~~P3-9 · Calibration Labs CRUD~~ | Done — `/admin/calibration-labs` |
| ~~P3-10 · Suppliers CRUD~~ | Done — `/admin/suppliers` |
| ~~P3-11 · PM Plan → Auto-generate WOs~~ | Done — `generatePMWorkOrders()` in `pm-schedule/actions.ts` |
| ~~P3-12 · Spare Parts Inventory~~ | Done — list, create/edit, stock adjust, WO parts panel |
| ~~P3-15 · Edit Asset UI~~ | Done — edit button on `/assets/[id]` |
| ~~P3-16 · WO Detail — Close with Notes~~ | Done — `WOStatusActions` close dialog captures laborHours, failure codes |
| ~~P4-1 · Reports Page~~ | Done — 5 Recharts charts, KPI row |
| ~~P4-2 · QR Code Scan & Print~~ | Done — `asset-qr-button.tsx` + `QRScanner` |
| ~~P4-6 · Dark Mode Verification~~ | Done — all components use CSS vars |
| ~~Font weight 800 on logo M~~ | Fixed — `fontWeight: 800 → 600` in `sidebar.tsx` + `login/page.tsx` |
| ~~Font-bold (700) in 2 spots~~ | Fixed — `font-bold → font-semibold` in `asset-qr-button.tsx` + `wo-types/page.tsx` |

---

## 🔲 Open — Phase 5

### P5 · Workflow Engine (Approval Engine)
**Status:** Designer UI complete, engine is stub in `lib/workflow-engine.ts`

When ready:
1. `initWorkflow(workOrderId, workflowId)` — create first `WOApproval` record on WO create
2. `advanceWorkflow(woApprovalId, action, actorId)` — state machine transitions
3. UI: step progress on WO detail + approve/reject/return buttons for matching role
4. Notifications per step

**Note:** Phase 5 banner visible in `/admin/workflow-designer`. Remove when engine is live.

---

## 🔲 Open — Remaining gaps

| Item | Priority | Effort |
|------|----------|--------|
| Roles CRUD UI (`/admin/roles`) | Medium | M — page shell exists, no CRUD |
| Wire Notification store to real DB data | Medium | M — `store/notifications.ts` shape ready |
| Mold Shot Count tracking on WO close | Low | M |
| E2E Playwright test suite | Low | M |
| Google Fonts `@import` → `next/font/google` | Low | S |
| `: any` in `qr-scanner.tsx:22` | Low | S |
| Unit tests for `lib/kpi.ts` | Low | M |
| Production deployment (env, domain, DB) | Whenever needed | S |

---

## Polish backlog (deferred)

| Item | File | Status |
|------|------|--------|
| Google Fonts CSS `@import` (render-blocking) | `app/globals.css:2` | Open — migrate to `next/font/google` |
| `: any` in QR scanner | `components/scan/qr-scanner.tsx:22` | Open — narrow with local interface |
| Unit tests for `lib/kpi.ts` | — | Open — `vitest` installed, zero tests |
