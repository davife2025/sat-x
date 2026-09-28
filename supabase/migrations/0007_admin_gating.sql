-- Platform admin flag. Deliberately just a boolean on profiles, not a
-- separate roles table — "two admins" is a small, fixed set of trusted
-- people, not something that needs a general permissions system yet.
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Re-defined with an admin check added. Joining a team (join_team) is
-- NOT touched — that stays open to any authenticated user, since that's
-- how a regular person actually gets into a group after an admin hands
-- them a platform invite code.

create or replace function public.create_team(team_name text)
returns public.teams
language plpgsql
security definer set search_path = public
as $$
declare
  new_team public.teams;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'admin_only';
  end if;

  insert into public.teams (name, created_by) values (team_name, auth.uid())
  returning * into new_team;

  insert into public.team_members (team_id, user_id, role)
  values (new_team.id, auth.uid(), 'owner');

  return new_team;
end;
$$;

create or replace function public.create_invite_code()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  new_code text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'admin_only';
  end if;

  insert into public.invite_codes (created_by) values (auth.uid())
  returning code into new_code;
  return new_code;
end;
$$;
