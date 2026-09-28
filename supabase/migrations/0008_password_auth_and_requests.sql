-- ---------------------------------------------------------------------
-- 1) SECURITY FIX for a hole introduced by 0007.
-- profiles has an "update your own row" RLS policy, and 0007 added
-- is_admin to that table — so any signed-in user could have run
-- profiles.update({ is_admin: true }) on themselves. RLS decides which
-- ROWS you can touch, not which columns, so restrict columns with
-- column-level grants: users may only update these three.
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists password_changed boolean not null default false;

revoke update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url, password_changed) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- 2) SECURITY FIX: invite RPCs were callable by anyone with the anon key.
-- Supabase grants EXECUTE on new public functions to anon/authenticated
-- by default, so "grant ... to service_role" in 0004 never restricted
-- anything. Anyone could call redeem_invite_code directly (guessing
-- codes, burning valid ones) without going through the rate-limited API.
-- ---------------------------------------------------------------------
revoke execute on function public.redeem_invite_code(text) from public, anon, authenticated;
grant execute on function public.redeem_invite_code(text) to service_role;
revoke execute on function public.create_invite_code() from public, anon;

-- Used by the API to hand a code back if account creation fails after
-- the code was already consumed (e.g. the email is already registered).
create or replace function public.release_invite_code(target_code text)
returns void
language sql
security definer set search_path = public
as $$
  update public.invite_codes
  set use_count = greatest(use_count - 1, 0)
  where code = target_code;
$$;
revoke execute on function public.release_invite_code(text) from public, anon, authenticated;
grant execute on function public.release_invite_code(text) to service_role;

-- ---------------------------------------------------------------------
-- 3) An invite code is now also the new person's initial password, so it
-- should come from a proper random source, and be longer. (Existing
-- 8-character codes keep working.)
-- ---------------------------------------------------------------------
alter table public.invite_codes
  alter column code set default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);

-- ---------------------------------------------------------------------
-- 4) Requesting an invite. Rows are inserted by the API (service role);
-- no RLS policies at all, so nobody reads or writes this table directly.
-- Admins go through the three functions below.
-- ---------------------------------------------------------------------
create table if not exists public.invite_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'dismissed')),
  invite_code text,
  created_at timestamptz not null default now()
);

create unique index if not exists invite_requests_one_pending_per_email
  on public.invite_requests (lower(email)) where status = 'pending';

alter table public.invite_requests enable row level security;

-- Once an approved code has been redeemed it is that person's live
-- password, so it stops being shown to admins at that point.
create or replace function public.list_invite_requests()
returns table (
  request_id uuid,
  email text,
  note text,
  status text,
  created_at timestamptz,
  unredeemed_code text
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) then
    raise exception 'admin_only';
  end if;

  return query
    select r.id, r.email, r.note, r.status, r.created_at,
           case when c.code is not null and c.use_count < c.max_uses then c.code else null end
    from public.invite_requests r
    left join public.invite_codes c on c.code = r.invite_code
    order by (r.status = 'pending') desc, r.created_at desc;
end;
$$;

create or replace function public.approve_invite_request(target_request uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  new_code text;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) then
    raise exception 'admin_only';
  end if;

  if not exists (select 1 from public.invite_requests r where r.id = target_request and r.status = 'pending') then
    raise exception 'not_pending';
  end if;

  insert into public.invite_codes (created_by) values (auth.uid())
  returning code into new_code;

  update public.invite_requests
  set status = 'approved', invite_code = new_code
  where id = target_request;

  return new_code;
end;
$$;

create or replace function public.dismiss_invite_request(target_request uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) then
    raise exception 'admin_only';
  end if;

  update public.invite_requests
  set status = 'dismissed'
  where id = target_request and status = 'pending';
end;
$$;

revoke execute on function public.list_invite_requests() from public, anon;
revoke execute on function public.approve_invite_request(uuid) from public, anon;
revoke execute on function public.dismiss_invite_request(uuid) from public, anon;
grant execute on function public.list_invite_requests() to authenticated;
grant execute on function public.approve_invite_request(uuid) to authenticated;
grant execute on function public.dismiss_invite_request(uuid) to authenticated;
