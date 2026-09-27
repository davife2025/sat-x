-- Platform-level invite gating. Separate from a team's join_code
-- (Session 2) — join_code gets you into a specific team once you
-- already have an account; invite_codes gates whether an account can
-- be created at all.

create table if not exists public.invite_codes (
  code text primary key default substr(md5(random()::text), 1, 8),
  created_by uuid references auth.users (id),
  max_uses int not null default 1,
  use_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.invite_codes enable row level security;
-- Deliberately zero SELECT/INSERT/UPDATE policies — this table is
-- reachable only through the two functions below: any signed-in user
-- can mint their own code, but redeeming one happens server-side via
-- apps/api's service-role client (the redeemer has no session yet, so
-- RLS couldn't apply to them directly anyway).

create or replace function public.create_invite_code()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  new_code text;
begin
  insert into public.invite_codes (created_by) values (auth.uid())
  returning code into new_code;
  return new_code;
end;
$$;

grant execute on function public.create_invite_code() to authenticated;

-- Atomically checks-and-consumes in one statement (UPDATE ... WHERE
-- use_count < max_uses) so two people redeeming the same last-use code
-- at once can't both succeed.
create or replace function public.redeem_invite_code(target_code text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  affected int;
begin
  update public.invite_codes
  set use_count = use_count + 1
  where code = target_code and use_count < max_uses;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

grant execute on function public.redeem_invite_code(text) to service_role;
