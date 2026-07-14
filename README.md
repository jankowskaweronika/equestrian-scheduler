# Equestrian Scheduler

Calendar-first scheduling platform for equestrian centers. MVP is tested in a real center with a multi-tenant architecture ready for future SaaS.

## Stack

- **Web admin:** Next.js + TypeScript (Vercel)
- **Mobile:** React Native + Expo + TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **Monorepo:** pnpm workspaces + Turborepo
- **Architecture:** Hexagonal — domain logic in `packages/domain`, adapters in apps and Supabase

## Repository structure

```text
apps/
  web/       Next.js panel for managers and instructors
  mobile/    Expo app for instructors, clients, and boarders
packages/
  domain/    Entities, ports, permissions (no framework imports)
  calendar/  Collision detection, horse utilization, occupancy rules
  ui-tokens/ Shared colors and typography
  config/    Shared TypeScript and ESLint configs
supabase/
  migrations/
  functions/
  seed.sql
docs/
```

## Prerequisites

- Node.js 20+
- pnpm 9 (`npx pnpm@9.15.0` if not installed globally)

## Getting started

```bash
# Install dependencies
npx pnpm@9.15.9 install

# Build shared packages
npx pnpm@9.15.9 build

# Run web admin (http://localhost:3000)
npx pnpm@9.15.9 --filter @equestrian-scheduler/web dev

# Run mobile app (Expo)
npx pnpm@9.15.9 --filter @equestrian-scheduler/mobile dev
```

Copy environment templates before connecting Supabase:

- `apps/web/.env.example` → `apps/web/.env.local`
- `apps/mobile/.env.example` → `apps/mobile/.env`

## Scripts

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `pnpm dev`       | Start all apps in dev mode     |
| `pnpm build`     | Build all packages and apps    |
| `pnpm lint`      | Run ESLint across the monorepo |
| `pnpm typecheck` | Run TypeScript checks          |
| `pnpm format`    | Format with Prettier           |

## Implementation stages

1. **Etap 0** — Monorepo scaffold, CI, shared packages
2. **Etap 1** — Supabase schema, RLS, invites, manager panel basics
3. **Etap 2** — Web calendar (resource columns, drag & drop, series)
4. **Etap 3** — Mobile app (lessons, free slots, requests)
5. **Etap 4** — Push notifications, reminders, pilot testing

## Roles

| Role            | Access                                                     |
| --------------- | ---------------------------------------------------------- |
| `product_admin` | Create organizations, full system access during pilot      |
| `manager`       | Full management within own center                          |
| `instructor`    | All lessons in center; create, move, cancel, assign horses |
| `client`        | Own rides, free slots, booking requests                    |
| `boarder`       | Own rides, anonymous hall occupancy                        |

## License

Private — all rights reserved.
