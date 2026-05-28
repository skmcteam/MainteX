# TODO — SKMC CMMS

> Prioritized backlog as of 2026-05-28. Phase 3 is next.

---

## Phase 3 — Admin & Master Data

Build the admin panel so operators can manage reference data without needing a developer.

### P3-1 · Fix WO Number Series race condition ⚠️ (do first)
**File:** `app/(app)/work-orders/actions.ts` → `createWorkOrder()`  
**Problem:** Read-then-write on `WONumberSeries.lastNumber` is not atomic under concurrency.  
**Fix:** Use `prisma.$queryRaw` with `UPDATE ... RETURNING` or a Postgres sequence.
```sql
-- Option A: atomic update
UPDATE "WONumberSeries"
SET "lastNumber" = "lastNumber" + 1
WHERE pattern = 'WO-{YY}{MM}-{####}'
RETURNING "lastNumber";
```

### P3-2 · Fix calStatus auto-update
**Problem:** `Asset.calStatus` goes stale as time passes. Currently only set on record and in seed.  
**Options:**
- A) Computed at query time: in `getCalibrationAssets()`, compute calStatus from `nextCalDate` vs `new Date()` instead of reading the stored field
- B) Scheduled job: Next.js route handler at `/api/cron/update-cal-status` called by a cron
- **Recommended: Option A** — delete `calStatus` from schema or keep it but always override with computed value in the actions

### P3-3 · Users CRUD (`/admin/users`)
**Template:** Follow the pattern from asset-table.tsx + asset-form-modal.tsx  
**Fields:** nameTh, nameEn, email, password (hashed), roleId, departmentId, sectionId, isActive  
**Actions needed:** `getUsers()`, `createUser()`, `updateUser()`, `toggleUserActive()`  
**Note:** `createUser` must `bcrypt.hash(password, 10)` — cannot use Edge Runtime, keep in server action

### P3-4 · Roles & Permissions UI (`/admin/roles`)
Display `Role` → `RolePermission` → `Permission` join table.  
Read-only for system roles (`isSystem: true`). CRUD for custom roles.

### P3-5 · Departments / Sections / Areas CRUD
Three separate admin pages, each with a simple table + create modal.  
Pattern is the same — copy from an existing admin placeholder and add actions.

### P3-6 · Asset Classes CRUD (`/admin/asset-classes`)
Fields: code, nameTh, nameEn, category, criticality, color (color picker).

### P3-7 · WO Types & Priorities CRUD
Simple table + modal, sortable (drag-drop or order field).

### P3-8 · Checklist Template Builder (`/admin/checklist-templates`)
Complex: a template has many `ChecklistItem` rows with sortOrder.  
- List view: table of templates with item count
- Detail/edit view: sortable item list (use `@dnd-kit/sortable` — already installed)
- Item fields: descriptionTh, descriptionEn, categoryId, standard, whoResponsible, isCritical

### P3-9 · Calibration Labs CRUD (`/admin/calibration-labs`)
Simple table + modal: code, nameTh, nameEn, contact, phone, email, accreditNo.

### P3-10 · Suppliers CRUD (`/admin/suppliers`)
Same pattern: code, nameTh, nameEn, contact, phone, email, leadTimeDays, isActive.

---

## Phase 3 — Core Fixes & Missing Logic

### P3-11 · PM Plan → Auto-generate Work Orders
**Trigger:** When a PMPlan's `nextDueDate` is within `leadTimeDays` of today and no open WO exists for that plan.  
**Where to implement:**
- Add a server action `generatePMWorkOrders()` in `pm-schedule/actions.ts`
- Call it from the PM schedule page (button "สร้างใบสั่งซ่อม" in PM list)
- OR add a cron route `/api/cron/pm-generate` for automated generation
- On WO creation from PM: set `WorkOrder.pmPlanId`, copy checklist items from template, set `PMPlan.nextDueDate += frequency.intervalDays`

### P3-12 · Spare Parts Inventory (`/spare-parts`)
**Subfeatures:**
1. Parts list with search, low-stock tab (stockOnHand < reorderPoint)
2. Create/edit part modal (code, name, unit, supplier, warehouse, shelf, reorderPoint, unitCost)
3. Stock adjustment modal (manual +/- with reason)
4. **WO parts tab** — on WO detail, ability to add/remove WOSparePart records and deduct stock
**Actions needed:** `getSpareParts()`, `createSparePart()`, `adjustStock()`, `addPartToWO()`, `removePartFromWO()`

### P3-13 · Notification Events
**When to fire notifications (create `Notification` records):**
- `createWorkOrder()` with URGENT priority → notify MAINTENANCE_SUPERVISOR + MAINTENANCE_MANAGER
- PM due within leadTimeDays → notify assignee (from cron or PM page load)
- Calibration OVERDUE → notify MAINTENANCE_MANAGER (from cron or cal page)
- WO approval required → notify role-based approver
**Store:** Zustand `store/notifications.ts` already has shape — just needs real data from `prisma.notification.findMany`

### P3-14 · Approval Workflow Engine
**How it should work:**
1. On `createWorkOrder()`, if WOType has a `defaultWorkflowId`, create `WOApproval` rows (one per step)
2. Add `approveStep(workOrderId, stepId, action, comment)` server action
3. On approve: move to next step; on final approve: set WO status = DONE or trigger next state
4. `WOStatusActions` component should show approval buttons when user's role matches current step
**Complex — scope carefully before implementing**

### P3-15 · Edit Asset UI
**What's needed:**
- Edit button on `/assets/[id]` → opens same `AssetFormModal` pre-filled with current values
- `updateAsset(id, input)` server action already exists in `assets/actions.ts`
- Pass `asset` prop to modal when editing; modal detects edit mode via `asset !== null`

### P3-16 · WO Detail — Add Note / Close with Notes
**What's needed:** On the WO detail status action "เสร็จสิ้น", show a small dialog to enter:
- laborHours (number)
- notes (textarea)
- failureCodeId, causeCodeId, actionCodeId (selects)
Pass these to `updateWOStatus(id, "DONE", extras)`.

---

## Phase 4 — Polish & Production

### P4-1 · Reports Page (`/reports`)
- CM vs PM count per month (bar chart)
- Cost breakdown by department (pie)
- Asset availability trend (line)
- Top 5 bad actors (most WOs)
- PM compliance % per month
- All using Recharts, data from Prisma aggregations

### P4-2 · QR Code Scan & Print
- Asset detail: "พิมพ์ QR" button → generates printable label using `qrcode.react`
- Scan page: `html5-qrcode` scanner → navigate to asset detail

### P4-3 · Mold Shot Count Tracking
- On WO close for a mold asset, prompt for shots produced
- Increment `Asset.shotCount`
- Check against PM triggers (shotCount % usageInterval == 0 → generate PM WO)

### P4-4 · Export to Excel / PDF
- Spare parts list → CSV/Excel (`xlsx` package)
- WO history report → PDF (use browser `window.print()` with a print stylesheet, or `jspdf`)

### P4-5 · Mobile Testing
- Tables need `overflow-x: auto` wrappers — verify on 375px width
- Bottom nav covers content — verify `paddingBottom: "72px"` is sufficient
- Asset form modal scrolls properly on iOS Safari

### P4-6 · Dark Mode Verification
- Test all new Phase 2 components in dark mode (all use CSS vars so should be correct)
- Check modal overlay opacity in dark mode

### P4-7 · Playwright E2E Test Suite
- Login + navigate to each module
- Create a WO end-to-end
- Record calibration

### P4-8 · Production Deployment
- Environment variables for production PostgreSQL
- `AUTH_SECRET` generation: `openssl rand -base64 32`
- `NEXTAUTH_URL` set to production domain
- `pnpm build` + `pnpm start` or Docker deployment
- Configure `NEXTAUTH_URL` and `AUTH_SECRET` as env vars

---

## Bugs to Fix

| Bug | Severity | Location |
|---|---|---|
| WO number series race condition | Medium | `work-orders/actions.ts:createWorkOrder` |
| calStatus goes stale over time | Medium | `calibration/actions.ts:getCalibrationAssets` |
| PM plans have no nextDueDate in seed | Low | `prisma/seed.ts` — add nextDueDate calculation |
| Edit asset has no UI trigger | Low | `assets/[id]/page.tsx` — add Edit button |
| WO completion has no cost entry | Low | `wo-status-actions.tsx` — add completion dialog |
| `WONumberSeries.lastNumber` out of sync with sample data | Low | Reset to 3 or reseed |

---

## Quick Wins (< 1 hour each)

- Add PM plan `nextDueDate` in seed data (calculate from `lastDoneDate + intervalDays`)
- Add edit button to asset detail that reuses `AssetFormModal` in edit mode
- Add WO count badge to sidebar "ใบสั่งซ่อม" nav item (fetch count in layout)
- Compute `calStatus` at query time in `getCalibrationAssets()` instead of reading stale DB value
- Add `title` attribute (tooltip) to collapsed sidebar icon links
