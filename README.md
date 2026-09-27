# sat-x

A social network for satellite-building teams — the name is "sat"
(satellite) + "x" (styled after the X app). Built web-first for now.

## Stack

- **apps/web** — Next.js 14 (App Router), TypeScript, Tailwind
- **apps/api** — Fastify, TypeScript
- **Supabase** — Postgres, Auth, Realtime (Realtime is provisioned for
  Session 3's live-location feature, not used yet)
- **packages/shared** — TS types/config shared by both apps
- pnpm workspaces + Turborepo

## Getting started

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env` at the repo root, and fill in the four
   Supabase values from your project's Settings → API page.
3. Run the migration against your project (SQL editor, or the Supabase
   CLI): `supabase/migrations/0001_init_profiles.sql`.
4. Install and run:

   ```bash
   pnpm install
   pnpm dev
   ```

   This starts apps/web on `:3000` and apps/api on `:4000` together. Use
   `pnpm dev:web` / `pnpm dev:api` to run just one.

5. Visit `http://localhost:3000`, create an account, and confirm you land
   on `/dashboard` — that's the whole Session 1 loop working end to end.

## What's here vs. what's next

This is Session 1: auth, base layout, and the web ↔ api ↔ Supabase wiring
— no product features yet, on purpose (see `BUILD_ROADMAP.md`). The
visual design is placeholder tokens, not a real brand pass.

## Repo layout

```
apps/
  web/    Next.js app (the actual product UI)
  api/    Fastify API (server-only Supabase access, protected routes)
packages/
  shared/ Types and config shared by both apps
supabase/
  migrations/  SQL migrations, applied in order
```
