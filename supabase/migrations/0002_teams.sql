-- Session 2: teams + membership. Location/GPS is still deferred to Session 3.

create type public.team_role as enum ('owner', 'member');

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique default substr(md5(random()::text), 1, 8),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.team_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- You can only see teams/members for teams you belong to. Nobody can
-- browse all teams or all members directly — only through the RPCs below,
-- which check membership/ownership explicitly.
create policy "members can read their teams"
  on public.teams for select to authenticated
  using (id in (select team_id from public.team_members where user_id = auth.uid()));

create policy "members can read their team's roster"
  on public.team_members for select to authenticated
  using (team_id in (select team_id from public.team_members where user_id = auth.uid()));

-- Direct inserts into teams/team_members are NOT allowed by policy (no
-- insert policy = denied under RLS). Creating/joining a team goes through
-- these security-definer functions instead, so "create the team" and "add
-- me as owner" happen as one atomic, trusted step.

create or replace function public.create_team(team_name text)
returns public.teams
language plpgsql
security definer set search_path = public
as $$
declare
  new_team public.teams;
begin
  insert into public.teams (name, created_by) values (team_name, auth.uid())
  returning * into new_team;

  insert into public.team_members (team_id, user_id, role)
  values (new_team.id, auth.uid(), 'owner');

  return new_team;
end;
$$;

create or replace function public.join_team(code text)
returns public.teams
language plpgsql
security definer set search_path = public
as $$
declare
  target public.teams;
begin
  select * into target from public.teams where join_code = code;
  if target.id is null then
    raise exception 'invalid_join_code';
  end if;

  insert into public.team_members (team_id, user_id, role)
  values (target.id, auth.uid(), 'member')
  on conflict (team_id, user_id) do nothing;

  return target;
end;
$$;

grant execute on function public.create_team(text) to authenticated;
grant execute on function public.join_team(text) to authenticated;
