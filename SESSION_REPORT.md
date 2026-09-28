# Session 3.10 Report — Admin-controlled access, password sign-in

## Two security holes found and fixed (mine, from earlier migrations)

1. **Self-promotion to admin (0007).** `profiles` has an "update your own
   row" policy, and 0007 put `is_admin` on that table. RLS limits which
   *rows* you can update, not which *columns*, so any signed-in user could
   have set `is_admin = true` on themselves from the browser. Fixed in
   0008 with column-level grants: users can only update `display_name`,
   `avatar_url`, `password_changed`.
2. **Invite RPCs callable by anyone (0004).** `redeem_invite_code` was
   granted to `service_role`, but Supabase also grants EXECUTE on new
   functions to `anon`/`authenticated` by default, so it was never
   restricted. Anyone with the public anon key could call it directly
   — guessing codes, burning valid ones — bypassing the API. Fixed in
   0008 (revoked; `service_role` only). Until 0007 was applied,
   `create_invite_code` was equally open.

## What changed

- **Access model:** only admins create groups and generate invite codes.
  Joining a group with its join code stays open to everyone.
- **Sign-in:** one form — email + "invite code or password". Existing
  account → password sign-in. Otherwise the value is tried as an invite
  code: the API consumes it, creates the account with the **code as its
  password**, and the browser signs in. Password changeable in
  `/security` (was a placeholder page).
- **Request an invite:** second tab on the sign-in page → API stores the
  request → admins see it on `/admin` and click *Approve & generate
  code*. **Delivery is manual**: the admin copies the code and sends it
  themselves. There's no email-sending infrastructure in this project
  (Supabase's mailer only sends auth emails), so I didn't fake one.
- **Admin page** (`/admin`, "Admin" appears in the menu for admins only):
  generate a code, review/approve/dismiss requests. Once an approved
  code has been redeemed it is that person's live password, so it stops
  being displayed there.
- **Menu:** the toggle is now the user's avatar (silhouette placeholder
  when none), and a click anywhere outside closes it. The placeholder is
  a black icon, so it gets the dark-mode invert (the same fix applies to
  the profile-page placeholder).
- **API:** `POST /invites/redeem` rewritten; new `POST /invites/request`;
  rate limiting added (10/min redeem, 10/hour request — per IP;
  `trustProxy` on so it works behind Render). Removed the now-unneeded
  anon-key client; `SUPABASE_ANON_KEY` is no longer required by the API.
- **Invite codes** are 12 characters from a proper random source now
  (were 8, from `random()` + md5). Old 8-char codes still work.
- Existing account can never have its password overwritten by a code: if
  the email is already registered, the code is refunded and the API
  returns `account_exists`.

## Verified this session

- Typecheck (all 3 packages) and builds (web: 24 routes incl. `/admin`,
  `/security`; api) clean.
- Booted the API: validation returns 400s, and the rate limiter really
  trips (10 allowed per minute, then 429).
- **Not run:** anything against a live Supabase project (sign-up via
  code, approve flow, password change). Same standing caveat.

## Things you should know

- **Until a person changes it, whoever gave them the code knows their
  password.** That's inherent to "the invite code is the password". Mitigations
  built in: a banner on Home nags them to change it, and admins stop
  seeing the code once redeemed. Not built: forcing a change at first
  login — say if you want it.
- **Accounts made before this change** (magic-link era) have no password
  and can't sign in now. Set one in Supabase → Authentication → Users, or
  re-invite them. There's no "forgot password" flow yet — worth adding,
  since forgetting a 12-character code-password is likely.
- **Supabase password rules:** if you enabled strong-password
  requirements (Auth → Providers/Policies), an all-hex code may be
  rejected and signup will fail with that message. Default rules are fine.
- Supabase's "secure password change" setting, if on, can require a
  recent login before `/security` will accept a new password.

## Before this works (in order)

1. Run `0007_admin_gating.sql` then `0008_password_auth_and_requests.sql`
   in the Supabase SQL editor.
2. Make your two admins (create their accounts in Supabase → Authentication
   → Users → Add user, *with a password*, then):
   ```sql
   update public.profiles set is_admin = true
   where id in (select id from auth.users
                where email in ('admin1@example.com', 'admin2@example.com'));
   ```
3. Redeploy **both** from this zip: Vercel (web) and Render (api). Render
   needs `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `WEB_ORIGIN` set
   to your exact Vercel URL; Vercel needs `NEXT_PUBLIC_API_URL` set to
   your Render URL — sign-in for new people goes through it.
