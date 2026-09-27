# Session 3 Report — Sign-in simplification, polls, public browsing

Delivered as one session since all three were requested together;
reorders ahead of the live-map session per your steer.

## What this session covers

1. Replaced password auth with passwordless magic-link + Google OAuth.
2. Polls scoped to a team, with voting.
3. A team's owner can flip it to publicly viewable — real teams,
   read-only, no account needed, so a prospective user can see the app
   working before signing in.

## Built

- `supabase/migrations/0003_polls_and_public_teams.sql` —
  - `teams.is_public` column + an owner-only update policy.
  - Additive `to anon, authenticated` SELECT policies on `teams` and
    `team_members` for `is_public = true` rows (additive, not a
    replacement — private teams are unaffected; Postgres ORs permissive
    policies together).
  - `polls`, `poll_options`, `poll_votes` tables, each with a
    members-only read policy AND an anon-inclusive public-team read
    policy.
  - `create_poll`/`cast_vote` RPCs (`security definer`, same atomic
    pattern as `create_team`/`join_team`). No insert policies exist on
    any of the three tables — writes only happen through these RPCs.
    Anonymous voting is blocked implicitly: `auth.uid()` is null for an
    anon caller, so the membership check inside both RPCs always fails
    — no separate "block anonymous writes" logic was needed.
  - `poll_option_results` view (`security_invoker`) — vote counts per
    option, automatically scoped by the same RLS as the base tables.
- `apps/web/src/app/auth/callback/route.ts` — exchanges the PKCE code
  from a magic-link click or Google redirect for a session.
- `apps/web/src/app/(auth)/sign-in/page.tsx` — rewritten: one email
  field, "send magic link" (creates the account if new) + a "Continue
  with Google" button. No password field anywhere anymore.
- `apps/web/src/app/(auth)/sign-up/page.tsx` — now just redirects to
  `/sign-in` (kept so old links don't 404).
- `apps/web/src/app/demo/page.tsx` — lists public teams; works with no
  session at all.
- `apps/web/src/app/teams/[id]/page.tsx` — no longer hard-redirects
  signed-out visitors. Logic now: query the team (RLS decides
  visibility) → if found, show it (with a "you're viewing read-only"
  banner if you're not a member); if not found AND signed out, prompt
  sign-in (ambiguous — could be private or just needs auth); if not
  found AND signed in, 404 (same "don't leak existence" reasoning as
  Session 2). Owners get a visibility-toggle button.
- `apps/web/src/app/teams/[id]/actions.ts` — `setTeamVisibilityAction`,
  RLS-enforced owner-only.
- `apps/web/src/app/teams/[id]/polls/` — `actions.ts` (create/vote),
  `page.tsx` (list — read-only bars for anonymous/non-member viewers,
  clickable vote buttons for members), `new/page.tsx` +
  `new/poll-form.tsx` (server wrapper + client component split, to
  avoid relying on React's `use()` hook — not stably available in the
  React 18.3 this app pins, whereas `await`-ing the already-resolved
  params object in a Server Component is fine either way).
- `packages/shared/src/types.ts` — `Team.isPublic`, `Poll`,
  `PollOptionResult`.
- Landing page: one "Get started" button (→ `/sign-in`) plus "See it
  without an account" (→ `/demo`).

## Verified this session

- `pnpm install`, typecheck (all 3 packages) — clean, first pass.
- `pnpm --filter web build` — clean, first pass. All 12 routes present,
  including `/demo`, `/auth/callback`, `/teams/[id]/polls`,
  `/teams/[id]/polls/new`.
- Confirmed by reasoning through it (couldn't test live): an anonymous
  vote attempt fails at the RPC's own membership check before it could
  ever write a row, since `auth.uid()` is null with no session — this
  isn't a separate anon-blocking rule, it falls out of the existing
  `create_team`/`join_team`-style RPC pattern for free.
- **Not yet run:** a live walkthrough (magic link email actually
  arriving, Google OAuth round-trip, flipping a team public and viewing
  it from an incognito window). Needs your real Supabase project, and
  for Google specifically, OAuth credentials you create in Google Cloud
  Console and paste into Supabase's Auth → Providers settings.

## Known stubs / deliberately deferred

- No rate-limiting on magic-link requests (Supabase has built-in
  per-email cooldowns by default, but worth checking before relying on
  it at scale).
- No UI to see who's on a public team's polls has-voted vs hasn't,
  beyond the aggregate bars.
- Still no location/GPS — that's next (Session 4).

## Before this is really "done"

- Run `0003_polls_and_public_teams.sql` after `0001`/`0002` on the same
  project.
- In Supabase's dashboard: Auth → Providers → enable Google, using
  credentials from a Google Cloud Console OAuth app (redirect URI:
  `https://<your-supabase-project>.supabase.co/auth/v1/callback`).
- Sign in once, start a team, click "Make publicly viewable," then open
  `/demo` in an incognito window to confirm the read-only path actually
  works end to end.
