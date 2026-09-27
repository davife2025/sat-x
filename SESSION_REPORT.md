# Session 3.5 Report — X-style visual design pass

The placeholder tokens from Session 1 get replaced now, per your ask for
the real UI to look like X's.

## What changed

- `apps/web/src/app/globals.css` — X's actual palette approximated: pure
  black "Lights out" dark mode / white light mode, X blue (`hsl(203 89%
  53%)`) as the accent, hairline borders (`.x-row`) for feed-style lists
  instead of boxed cards.
- `tailwind.config.ts` — dropped the old `--radius` token mapping (it was
  shared between buttons and cards, which don't want the same radius in
  X's actual design — buttons are full pills, cards are rounded-2xl, not
  the same value).
- `components/ui/button.tsx` — `rounded-full`, bold weight — X's
  signature button shape.
- `components/ui/card.tsx`, `input.tsx` — rounded-2xl / taller fields,
  X's actual field proportions.
- **New: a real app shell** (`(app)/layout.tsx`) — left sidebar on
  desktop (wordmark, Home, New team, account/sign-out), condensed top
  bar on mobile. This is genuinely new structure, not just a restyle —
  moved `dashboard/`, `teams/`, and `demo/` into an `(app)` route group
  so they share it (route groups don't change the URL, so `/dashboard`
  etc. are unaffected).
  - Deliberately NOT gated on being signed in — it renders a "Sign in"
    button instead of the account menu when there's no session, so the
    public-team browsing from last session still works unchanged.
- `dashboard`, `teams/[id]`, `teams/[id]/polls`, `demo` pages — restyled
  their lists from boxed cards to hairline rows (X's actual timeline
  look).
- Added `lucide-react` for the sidebar icons — generic line icons, not
  X's own (trademarked) icon set or bird logo.

## Verified this session

- `pnpm install` (new dep), typecheck, `pnpm --filter web build` — all
  clean, first pass. All 11 routes still resolve at their original URLs
  after the route-group restructure.
- Also refreshed the standalone mock preview (same one from Session 1)
  to match — same palette/shell, still just static mock data, not part
  of the real app.

## Known stubs / deliberately deferred

- No dark/light toggle UI yet — currently follows the OS/browser's
  `prefers-color-scheme` only.
- Sidebar nav is intentionally minimal (Home, New team) — no global
  teams list or search yet, since those features don't exist.
- Still using system fonts, not a custom typeface — X's actual "Chirp"
  font is proprietary, not something to reproduce.

## Applying this diff

Because `dashboard/`, `teams/`, and `demo/` moved into an `(app)/` route
group, a flat diff can't express "delete the old path" — so **delete
`apps/web/src/app/dashboard/`, `apps/web/src/app/teams/`, and
`apps/web/src/app/demo/` first**, then unzip this on top. Everything
under `apps/web/src/app/(app)/` in this zip is the new location for
those same pages, plus the new `layout.tsx`/`actions.ts` shell files.

## Before this is really "done"

Nothing new needed beyond what earlier sessions already required (a
real Supabase project) — this session was code + styling only, no
schema changes.
