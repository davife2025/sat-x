# Session 3.9 Report — Profile photo upload, "your posts", AI icon

## Built

- `supabase/migrations/0006_avatars.sql` — `avatars` storage bucket
  (public-read), with insert/update policies scoped to
  `{user_id}/...` paths — tighter than `post-media`'s bucket-wide
  policy, since this prevents one account from overwriting another's
  avatar file even though both buckets are public-read.
- `profile/profile-form.tsx` (new, client) — same upload pattern as
  compose (upload to Storage from the browser, then submit the
  resulting public URL through the server action), plus an instant
  local preview via `URL.createObjectURL` before the upload finishes.
  Falls back to your provided profile-silhouette icon when there's no
  avatar yet, rather than a blank space.
- `profile/actions.ts` — `updateProfileAction` now also accepts and
  saves `avatar_url`.
- `profile/page.tsx` — rebuilt to also list the signed-in user's own
  posts (query by `author_id`, not `team_id` — this is the one query
  in the app so far that's genuinely about "your stuff" rather than
  "your team's stuff").
- `bottom-nav.tsx` — `sat-x AI`'s icon is now your satellite icon
  (previously text-only, since none of your nine matched it — you
  asked for it reused here rather than left blank).

## Verified this session

- Typecheck, `pnpm --filter web build` — clean, first pass. `/profile`
  now carries real client JS (1.68 kB) for the upload flow; every other
  route unaffected.

## Known limitations

- No image resizing/cropping on upload — whatever file size the person
  picks is what gets stored and displayed.
- Avatars aren't shown anywhere else yet (the feed and team member list
  still show display name only, no photo) — straightforward to add
  once you want it, didn't fold it in silently since it wasn't asked
  for this round.

## Before this is really "done"

Run `0006_avatars.sql` after `0001`-`0005` on the same project.
