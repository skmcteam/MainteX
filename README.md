# MainteX

Computerized Maintenance Management System for SKMC factory, Thailand.

## Quick Start

### Prerequisites
- Node.js 22+
- pnpm 11+
- PostgreSQL 15+ (running locally)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Prisma client (required after install due to pnpm build scripts)
node_modules/.bin/prisma generate

# 3. Copy env
cp .env.example .env
# Edit .env — update DATABASE_URL with your PostgreSQL user

# 4. Create database and run migrations
createdb skmc_cmms
node_modules/.bin/prisma migrate dev

# 5. Seed with sample data
node_modules/.bin/tsx prisma/seed.ts

# 6. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Login Credentials (dev/seed)
| Email | Password | Role |
|-------|----------|------|
| admin@skmc.co.th | skmc1234 | System Admin |
| manager@skmc.co.th | skmc1234 | Maintenance Manager |
| supervisor@skmc.co.th | skmc1234 | Maintenance Supervisor |
| tech1@skmc.co.th | skmc1234 | Technician |

## Tech Stack
- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v5 (JWT, credentials)
- **i18n:** next-intl (TH default, EN secondary)
- **State:** React Query + Zustand
- **UI:** Custom design system with CSS variables (no pre-built UI kit forced)

## Project Structure
See `CONTRIBUTING.md` for full architecture overview.

## Design System
All colors use CSS custom properties defined in `app/globals.css`:
- Light mode: `:root { --brand, --success, --warning, --danger, ... }`
- Dark mode: `[data-theme=dark] { ... }` — toggled by `ThemeToggle` component

## Database Commands
```bash
pnpm db:migrate    # Run pending migrations
pnpm db:seed       # Re-seed sample data
pnpm db:studio     # Open Prisma Studio
pnpm db:reset      # Reset + re-migrate (DESTROYS DATA)
```
