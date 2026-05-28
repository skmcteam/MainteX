# Architecture Decisions — MainteX

## D-001 · next-intl without URL routing

**Decision:** Locale stored in `NEXT_LOCALE` cookie only — no `/th/`, `/en/` URL prefixes, no `createMiddleware`.

**Why:** The app uses `(app)` and `(auth)` route groups. next-intl's routing middleware internally rewrites paths (e.g., `/login` → `/th/login`), which causes 404s with the route group structure. Cookie-only locale is simpler and avoids this conflict entirely.

**How it works:**
- `i18n/request.ts`: `getRequestConfig` reads `cookies().get("NEXT_LOCALE")?.value ?? "th"`
- `LanguageSwitcher`: sets `document.cookie = "NEXT_LOCALE=..."` then `router.refresh()`
- Thai is default; English is secondary

**Do not change:** Any approach that introduces `createMiddleware` or URL locale segments will break navigation.

---

## D-002 · Split NextAuth config for Edge Runtime

**Decision:** Two separate auth files: `lib/auth.config.ts` (edge-safe) and `lib/auth.ts` (Node.js only).

**Why:** Next.js middleware runs in the Edge Runtime, which cannot use Node.js APIs like Prisma or bcryptjs. Edge Runtime has no filesystem access, no native bindings, and no dynamic `require()`.

**Implementation:**
- `middleware.ts` imports `auth` only from `lib/auth.config.ts`
- `lib/auth.ts` imports `authConfig` from `lib/auth.config.ts` and adds the Credentials provider with Prisma + bcrypt
- Any server-side code that needs the full session calls `auth()` from `lib/auth.ts`

**Rule:** Never import `lib/auth.ts` in `middleware.ts`. Never add Prisma calls to `lib/auth.config.ts`.

---

## D-003 · Server Actions as the data layer (no API routes)

**Decision:** All database operations go through Next.js Server Actions (`"use server"` functions in `actions.ts` files), not API routes.

**Why:** Server Actions are co-located with the features they serve, are type-safe end-to-end, and eliminate a serialization boundary. For a single-tenant factory app with no external integrations yet, API routes add overhead without benefit.

**Pattern:**
```ts
// In actions.ts
"use server";
export async function createFoo(input: Input) {
  const data = schema.parse(input);   // zod validate
  await prisma.foo.create({ data });
  revalidatePath("/foo");
  return { success: true };
}

// In client component
const result = await createFoo(values); // called directly
router.refresh();
```

**Tradeoff:** If external systems (mobile app, ERP integration) need to call the same logic later, extract to `/api` routes and call the shared business logic from there.

---

## D-004 · Decimal serialization from Prisma

**Decision:** All Server Actions serialize Prisma `Decimal` fields with `Number(r.field)` and `Date` fields with `.toISOString()` before returning.

**Why:** Next.js cannot serialize Prisma's `Decimal` class or Date objects across the server/client boundary in Server Actions. Returning them raw causes a runtime error.

**Rule:** Every `actions.ts` return value must contain only plain JSON-serializable types. Check existing actions for the pattern.

---

## D-005 · PostgreSQL user on macOS

**Decision:** `DATABASE_URL=postgresql://pisitsak.kr@localhost:5432/skmc_cmms`

**Why:** macOS uses peer authentication by default. The local PostgreSQL install uses the macOS username (`pisitsak.kr`) as the database superuser, not `postgres`. This is standard for Homebrew PostgreSQL installs.

**Do not change:** Do not change the username to `postgres` — it doesn't exist on this system.

---

## D-006 · pnpm 11 build scripts via pnpm.yaml

**Decision:** Build scripts for native packages are configured in `pnpm.yaml`, not in `package.json#pnpm`.

**Why:** pnpm 11 moved the `onlyBuiltDependencies` config from `package.json` to `pnpm.yaml`. The `package.json#pnpm` key is silently ignored.

**After `pnpm install`:** Run `node_modules/.bin/prisma generate` manually if the post-install hook doesn't trigger. Use `node_modules/.bin/tsx prisma/seed.ts` for seeding (not `pnpm db:seed` directly if tsx isn't in PATH).

---

## D-007 · CSS custom properties over Tailwind semantic classes

**Decision:** Use `style={{ color: "var(--text)" }}` rather than Tailwind classes like `text-gray-700` for any semantic color.

**Why:** The app supports light and dark mode via `data-theme` attribute. All color tokens are defined as CSS custom properties in `globals.css` and swap between light/dark values via the `[data-theme=dark]` selector. Tailwind's static classes don't respond to this mechanism without additional configuration.

**Exceptions:** Tailwind utility classes for spacing, layout (`flex`, `grid`, `p-4`, `gap-2`, `rounded-lg`, etc.) are used normally.

---

## D-008 · Flat single-category Asset model

**Decision:** All asset categories (MACHINE, MOLD, IT, INSTRUMENT) share one `Asset` table with nullable category-specific columns, rather than separate tables or a polymorphic join.

**Why:** The asset categories share 80% of their fields (code, name, status, department, area, etc.). Category-specific fields are sparse (few rows use them simultaneously). A single table simplifies WO and PM relationships (both just reference `assetId`).

**Category-specific fields:**
- MACHINE: `machineHours`, `powerKw`, `voltage`
- MOLD: `shotCount`, `cavityCount`, `moldLifeShots`
- IT: `ipAddress`, `macAddress`, `osVersion`
- INSTRUMENT: `instrumentTypeId`, `calPeriodMonths`, `lastCalDate`, `nextCalDate`, `calLabId`, `calStatus`

---

## D-009 · Client-side filtering (not server-side pagination)

**Decision:** List pages fetch up to 200 rows and filter client-side (status tabs, search) rather than server-side pagination.

**Why:** Factory environment has bounded dataset sizes (437 machines, ~500 WOs per year). Client-side filtering gives instant tab switching with no network roundtrip, which is better UX in the factory floor context. If asset count exceeds ~2,000 or WO history exceeds ~5,000 rows, switch to URL-param-based server filtering.

**Limit:** `getWorkOrders()` takes 200 rows, `getAssets()` fetches all for the category, `getWOFormData()` assets are capped at 500.

---

## D-010 · Sonner for all user feedback

**Decision:** `sonner` toast library is the single feedback mechanism for all async operations.

**Why:** Already installed, already in the layout's `<Toaster>` (styled with CSS vars). Consistent pattern: every Server Action call in a client component wraps in try/catch and calls `toast.success(...)` or `toast.error(...)`.

**Position:** Top-right. Style inherits from CSS custom properties (themed correctly in light/dark).
