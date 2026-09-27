# sat-x — Build Roadmap

## Session 0 summary (research & scoping)

**One-line pitch:** sat-x is a web-based social network for satellite-building
teams — profiles, teams, and a feed, with real-time GPS so teammates can
find each other in the field.

**Timeline:** open-ended build, no external deadline/judges.

**Platform:** web first (Next.js). Revisit native/PWA wrapping once
real-time GPS in the field turns out to need background tracking that
browsers can't reliably do.

**Prior art check:** real satellite-building teams already exist (Stanford's
SSI Sats, UBC Orbit, various university CubeSat programs, and looser
groups like the Community Satellite Project) and currently coordinate
with generic tools — Slack, wikis, plain group chats. No dedicated
social/coordination platform for this niche turned up. Broader team-
location-sharing products exist (Life360, Find My) as the closest analog
for the GPS piece, but none are aimed at project teams.

**X-algorithm feasibility check:** X's open-sourced ranking engine
(`xai-org/x-algorithm`, rewritten in Rust/Python, Apache-2.0, actively
updated through 2026) covers backend candidate generation + scoring only
— X never open-sourced their client/UI code, and key model weights in
the released repo are redacted. Realistic takeaway: study its
architecture (candidate sourcing → scoring → heuristic filters → mixing)
as a reference for sat-x's own feed-ranking session; don't expect to
drop the repo in directly, and design the UI from scratch.

**GPS feature — design constraints carried into the roadmap:**
opt-in per user, visible only to your own team, and toggle-off-able at
any time — this is scoped into the session that builds it, not bolted
on after.

## Sessions

- **Session 1 — Core infrastructure ✅ delivered:** monorepo scaffold,
  Supabase-backed auth (sign up/in/out), base profile, deploy-ready
  skeleton for both apps. No product features yet.
- **Session 2 — Teams ✅ delivered:** create/join a team, member list,
  roles (owner/member), team profile page.
- **Session 3 — Sign-in simplification, polls, and public browsing ✅
  delivered** (reordered ahead of the live map at your request):
  passwordless magic-link + Google OAuth replacing password auth; polls
  with voting, scoped to a team; a team can be flipped to publicly
  viewable (read-only, no account needed) by its owner.
- **Session 4 — Live team map:** opt-in real-time GPS sharing among a
  team's members via Supabase Realtime, with an explicit on/off toggle
  and team-only visibility.
- **Session 5 — Feed v1:** posts scoped to a team, chronological first,
  ranking algorithm (inspired by X's architecture) layered in once
  there's real engagement data to rank against.
- **Session 6 — Interactions:** replies, reactions, notifications.
- **Session N — Polish & launch prep:** onboarding flow, empty states,
  deploy hardening.

Sessions 2+ are provisional — expect this list to change as sat-x's
"bunch of other features" get scoped one at a time.
