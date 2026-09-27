# Session 1 Report — Core Infrastructure

## What this session covers

Theme-agnostic foundation only, per `BUILD_ROADMAP.md`: monorepo scaffold,
Supabase-backed auth, base layout, deploy-ready skeleton for both apps.
No team/GPS/feed features — those are Sessions 2+.

## Built

- `apps/web` — Next.js 14 (App Router), TypeScript, Tailwind. Routes:
  `/` (landing), `/sign-in`, `/sign-up`, `/dashboard` (protected).
- `apps/api` — Fastify, TypeScript. Routes: `GET /health`,
  `GET /me` (protected — verifies a Supabase JWT, returns the caller's
  profile).
- `packages/shared` — `Profile`, `ApiResult`/`ApiError` types,
  `requireEnv` helper. Deliberately minimal — no team/location types yet.
- `supabase/migrations/0001_init_profiles.sql` — `profiles` table, RLS
  (readable by any authenticated user, writable only by its owner), and
  an `on_auth_user_created` trigger that creates the profile row
  automatically on sign-up.
- Root: `package.json` (pnpm workspaces), `turbo.json`, `.gitignore`,
  `.env.example`, `README.md`.

## Verified this session (milestone checks)

- `pnpm install` — clean, 175 packages, no peer-dep errors.
- `pnpm --filter @sat-x/shared typecheck` — clean.
- `pnpm --filter api typecheck` — clean.
- `pnpm --filter web typecheck` — clean (one real bug caught and fixed:
  `apps/web/src/lib/supabase/server.ts` had implicit-`any` params on the
  cookie-sync callback — now explicitly typed with `CookieOptions`).
- `pnpm --filter web build` — succeeds, generates all 4 routes. (One
  config bug caught and fixed: `postcss.config.js` was written as an ESM
  `export default`, but `apps/web`'s `package.json` has no
  `"type": "module"`, so Next's webpack loader expects CommonJS — changed
  to `module.exports`.)
- `pnpm --filter api build` — succeeds (`tsc` emits to `dist/`).
- Booted the built API (`node dist/index.js`) with dummy Supabase env
  vars and confirmed `GET /health` responds `{"ok":true,...}` — the
  server actually runs, not just compiles.
- **Not yet run:** a live sign-up → dashboard walkthrough against a real
  Supabase project (needs your actual project URL/keys — see
  "Before this is really done" below). The auth code path is written and
  typechecks, but hasn't hit a real database yet.

## Known stubs / deliberately deferred

- No `teams`, `team_members`, or location tables — Session 2/3.
- No GPS/geolocation code at all yet.
- UI is placeholder tokens (`globals.css`), not a real brand pass —
  intentional per "infra before theme."
- Supabase Realtime is not yet enabled/used (needed for Session 3's live
  map).
- No CI, no deploy config beyond the two `.env.example` files — this
  runs locally only for now.

## Before this is really "done"

1. Create a Supabase project, run the migration, fill in `.env` from
   `.env.example`.
2. `pnpm install && pnpm dev`, then actually create an account through
   the UI and confirm you land on `/dashboard` with your profile —
   this is the one thing I couldn't verify without your real Supabase
   credentials.
