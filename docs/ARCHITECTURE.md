# Architecture — MainteX

## Directory Structure

```
MainteX/
├── app/
│   ├── (app)/                  ← Protected app shell (auth-gated by layout.tsx)
│   │   ├── layout.tsx          ← Auth check, Sidebar+Topbar+BottomNav, Toaster
│   │   ├── page.tsx            ← redirect("/dashboard")
│   │   ├── dashboard/
│   │   │   ├── page.tsx        ← Server: fetches KPIs via getDashboardStats()
│   │   │   ├── actions.ts      ← getDashboardStats() — Prisma queries, KPI calc
│   │   │   └── dashboard-charts.tsx ← Client: Recharts pie chart for asset status
│   │   ├── assets/
│   │   │   ├── actions.ts      ← getAssets, getAsset, getAssetFormData, createAsset, updateAsset
│   │   │   ├── machines/page.tsx
│   │   │   ├── molds/page.tsx
│   │   │   ├── it/page.tsx
│   │   │   ├── instruments/page.tsx
│   │   │   └── [id]/page.tsx   ← Asset detail: info + related WOs/PMs/cals/parts
│   │   ├── work-orders/
│   │   │   ├── actions.ts      ← getWorkOrders, getWorkOrder, getWOFormData, createWorkOrder, updateWOStatus, updateChecklistItem
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx   ← WO detail: metadata + status actions + checklist + parts + approvals
│   │   ├── pm-schedule/
│   │   │   ├── actions.ts      ← getPMPlans, getPMFormData, createPMPlan, togglePMPlan
│   │   │   └── page.tsx
│   │   ├── calibration/
│   │   │   ├── actions.ts      ← getCalibrationAssets, getCalLabs, recordCalibration
│   │   │   └── page.tsx
│   │   ├── spare-parts/page.tsx ← Phase 3 placeholder
│   │   ├── reports/page.tsx    ← Phase 3 placeholder
│   │   └── admin/              ← Phase 3 placeholders (users, roles, workflows, etc.)
│   ├── (auth)/
│   │   └── login/page.tsx      ← NextAuth Credentials login form
│   ├── layout.tsx              ← Root layout: Providers (QueryClient, Session, NextIntl) + theme
│   └── globals.css             ← CSS custom properties (design tokens) + utilities
├── components/
│   ├── assets/
│   │   ├── asset-table.tsx     ← Client: filterable table, status tabs, search, row click nav
│   │   └── asset-form-modal.tsx ← Client: Radix Dialog, RHF, zod, createAsset action
│   ├── calibration/
│   │   ├── cal-list.tsx        ← Client: instrument table with cal-status colour coding
│   │   └── cal-form-modal.tsx  ← Client: record calibration, auto-fills nextCalDate
│   ├── pm/
│   │   ├── pm-list.tsx         ← Client: PM table, overdue/due-soon tabs, daysUntil calc
│   │   └── pm-form-modal.tsx   ← Client: create PM plan modal
│   ├── work-orders/
│   │   ├── wo-list.tsx         ← Client: WO table, status tabs, search, "สร้างใบสั่งซ่อม"
│   │   ├── wo-form-modal.tsx   ← Client: create WO, asset search select
│   │   ├── wo-status-actions.tsx ← Client: transition buttons (Open→InProgress→Done, etc.)
│   │   └── wo-checklist.tsx    ← Client: cycle PENDING→PASS→FAIL→NA with optimistic UI
│   ├── layout/
│   │   ├── sidebar.tsx         ← Collapsible sidebar with active link detection
│   │   ├── topbar.tsx          ← User avatar, notification bell, lang/theme toggles
│   │   ├── bottom-nav.tsx      ← Mobile bottom navigation (5 icons)
│   │   ├── sidebar-margin.tsx  ← Client: dynamic left margin matching sidebar width
│   │   ├── nav-items.ts        ← mainNav / assetNav / secondaryNav / bottomNav arrays
│   │   ├── language-switcher.tsx ← Sets NEXT_LOCALE cookie + router.refresh()
│   │   └── theme-toggle.tsx    ← Sets data-theme attr on <html>
│   ├── shared/
│   │   ├── status-pill.tsx     ← StatusPill, WOStatusPill, AssetStatusPill, CalStatusPill, PriorityPill
│   │   ├── stat-card.tsx       ← KPI card with icon, value, trend
│   │   └── empty-state.tsx     ← Centered icon + message for empty lists
│   └── providers.tsx           ← QueryClientProvider + SessionProvider + NextIntlClientProvider
├── lib/
│   ├── auth.config.ts          ← Edge-safe NextAuth config (callbacks, pages)
│   ├── auth.ts                 ← Full auth with Credentials + Prisma
│   ├── prisma.ts               ← Singleton PrismaClient
│   ├── kpi.ts                  ← computeKPIs (MTBF, MTTR, availability)
│   └── utils.ts                ← cn, toBkkTime, formatDate, formatDateTime, formatRelative, formatNumber, formatCurrency, generateWONumber, daysUntil
├── store/
│   ├── sidebar.ts              ← Zustand: collapsed state, persisted to localStorage
│   └── notifications.ts       ← Zustand: unread count, notification list
├── i18n/
│   ├── request.ts              ← getRequestConfig: reads NEXT_LOCALE cookie, defaults to "th"
│   ├── routing.ts              ← Defines supported locales ["th", "en"]
│   └── navigation.ts           ← Re-exports from next/navigation + next/link
├── types/index.ts              ← Re-exports Prisma types + defines composite types
├── middleware.ts               ← Edge auth guard (imports auth.config only)
├── messages/
│   ├── th.json                 ← Thai translations (primary)
│   └── en.json                 ← English translations
└── prisma/
    ├── schema.prisma           ← Full data model
    └── seed.ts                 ← Reference data + sample assets/WOs
```

## Data Model Overview

```
Plant → Department → Section
                  → User (roleId, departmentId, sectionId)
     → Area

Asset (category: MACHINE|MOLD|IT|INSTRUMENT)
  → AssetClass (category-specific)
  → Department, Section, Area
  → InstrumentType, CalibrationLab (INSTRUMENT only)
  → WorkOrder[] (linked work history)
  → PMPlan[] (PM schedules)
  → Calibration[] (cal history)
  → AssetSparePart[] (BOM)

WorkOrder
  → Asset, Priority, WOType, Workflow, Department
  → User (creator), User (assignee)
  → WOApproval[] (approval chain)
  → WOChecklistItem[] (from ChecklistTemplate)
  → WOSparePart[] (parts consumed)
  → WOAttachment[]
  → FailureCode, CauseCode, ActionCode

PMPlan → Asset, PMFrequency, ChecklistTemplate, User (assignee)
       → WorkOrder[] (auto-generated WOs — Phase 3)

Calibration → Asset, CalibrationLab, WorkOrder (optional)

SparePart → UnitOfMeasure, Supplier, Warehouse
          → AssetSparePart[], WOSparePart[]

Workflow → WorkflowStep[] (role-based approval chain)
WONumberSeries → pattern "WO-{YY}{MM}-{####}", lastNumber (auto-increments)
```

## Request Flow

```
Browser → middleware.ts (Edge, auth.config.ts only)
        → app/(app)/layout.tsx (auth() check, redirect to /login if fail)
        → Server Component Page (async, calls actions.ts functions)
            → actions.ts ("use server", Prisma query, serialize to plain obj)
        → Client Component (receives plain-obj props)
            → user interaction → calls actions.ts server action
            → revalidatePath() → router.refresh() → page re-fetches
```

## Auth Flow

```
POST /api/auth/callback/credentials
  → Credentials.authorize() in lib/auth.ts
  → Prisma: find user by email, bcrypt.compare password
  → Returns { id, email, nameTh, nameEn, role, image }
  → JWT callback: token.id = user.id, token.role, token.nameTh, token.nameEn
  → session callback: session.user.id, .role, .nameTh, .nameEn
  → Cookie: next-auth.session-token (HTTP-only JWT)

middleware.ts wraps auth — unauthenticated requests to non-public paths
redirect to /login. On /login when already logged in, redirect to /.
```

## i18n Flow

```
getRequestConfig (i18n/request.ts)
  ← reads cookies().get("NEXT_LOCALE")?.value ?? "th"
  → returns { locale, messages: require(`messages/${locale}.json`) }

LanguageSwitcher (client component)
  → document.cookie = "NEXT_LOCALE=en; path=/; max-age=..."
  → router.refresh()  ← triggers server re-render with new locale

All server components: const t = await getTranslations()
All client components: const t = useTranslations()
```

## CSS Design System

All design tokens are CSS custom properties in `app/globals.css`. Never use Tailwind color/spacing classes directly for semantic colors — always `style={{ color: "var(--text)" }}`.

### Semantic tokens
```css
--bg            /* page background */
--panel         /* card/sidebar background */
--panel-2       /* secondary surface (inputs, hover) */
--line          /* borders (0.5px solid var(--line)) */
--text          /* primary text */
--text-sub      /* secondary/muted text */
--brand         /* primary blue */
--brand-soft    /* brand at 10% opacity */
--success / --success-soft
--warning / --warning-soft
--danger  / --danger-soft
--purple  / --purple-soft
--cyan    / --cyan-soft
--orange  / --orange-soft
```

### Utility classes
```css
.panel-border   /* border 0.5px solid var(--line) + radius + var(--panel) bg */
.row-hover      /* :hover { background: var(--panel-2) } */
.form-input     /* standard input/select/textarea styling */
.font-mono-num  /* JetBrains Mono for codes and numbers */
.label-caps     /* 10.5px uppercase tracking for section labels */
```

## WO Number Generation

Pattern: `WO-{YY}{MM}-{####}` → e.g. `WO-2604-0001`
- `WONumberSeries.lastNumber` is atomically incremented in `createWorkOrder()`
- `generateWONumber(pattern, lastNumber)` in `lib/utils.ts` handles substitution
- Padded to 4 digits; wraps per month

## Status Transitions

### Work Order
```
OPEN → IN_PROGRESS (sets startTime)
     → CANCELLED
IN_PROGRESS → ON_HOLD
            → DONE (sets endTime)
ON_HOLD → IN_PROGRESS
        → CANCELLED
DONE → (terminal)
CANCELLED → (terminal)
```
Implemented in `components/work-orders/wo-status-actions.tsx` (TRANSITIONS map).

### Calibration Status (on Asset)
```
NORMAL → DUE_SOON (< 14 days to nextCalDate in dashboard logic)
       → OVERDUE  (past nextCalDate)
```
`calStatus` is computed and stored on the `Asset` record. Updated to `NORMAL` when `recordCalibration()` is called.

## KPI Calculations (`lib/kpi.ts`)

- **MTBF** = totalUptimeHours / correctiveWOCount
- **MTTR** = (totalRepairMinutes − holdMinutes) / 60 / correctiveWOCount
- **Availability** = MTBF / (MTBF + MTTR) × 100
- **Downtime** = (totalRepairMinutes − holdMinutes) / 60
- All values rounded to 1 decimal place
- Computed from CM WOs with `status=DONE` in the last 30 days
