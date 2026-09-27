-- Session 3, part A: let a team opt into being publicly viewable.
-- This is what makes "see the app without signing in" possible — a real
-- team's owner flips a switch, and that team's page + polls become
-- readable by anyone (writes still require being a real member).

alter table public.teams add column if not exists is_public boolean not null default false;

-- Owners can flip is_public (and, in future, rename the team etc).
create policy "owners can update their team"
  on public.teams for update to authenticated
  using (id in (select team_id from public.team_members where user_id = auth.uid() and role = 'owner'))
  with check (id in (select team_id from public.team_members where user_id = auth.uid() and role = 'owner'));

-- Second, additive SELECT policies: anyone (anon included) can read a
-- public team and its roster. This does NOT replace the existing
-- members-only policies — Postgres ORs multiple permissive policies
-- together, so a private team is still only visible to its members.
create policy "public teams are readable by anyone"
  on public.teams for select to anon, authenticated
  using (is_public = true);

create policy "public teams' rosters are readable by anyone"
  on public.team_members for select to anon, authenticated
  using (team_id in (select id from public.teams where is_public = true));


-- Session 3, part B: polls.

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  question text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  label text not null,
  position int not null default 0
);

create table if not exists public.poll_votes (
  poll_id uuid not null references public.polls (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  voted_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

create policy "team members can read their team's polls"
  on public.polls for select to authenticated
  using (team_id in (select team_id from public.team_members where user_id = auth.uid()));

create policy "public teams' polls are readable by anyone"
  on public.polls for select to anon, authenticated
  using (team_id in (select id from public.teams where is_public = true));

create policy "team members can read poll options"
  on public.poll_options for select to authenticated
  using (poll_id in (
    select p.id from public.polls p
    join public.team_members tm on tm.team_id = p.team_id
    where tm.user_id = auth.uid()
  ));

create policy "public teams' poll options are readable by anyone"
  on public.poll_options for select to anon, authenticated
  using (poll_id in (select id from public.polls where team_id in (select id from public.teams where is_public = true)));

create policy "team members can read poll votes"
  on public.poll_votes for select to authenticated
  using (poll_id in (
    select p.id from public.polls p
    join public.team_members tm on tm.team_id = p.team_id
    where tm.user_id = auth.uid()
  ));

create policy "public teams' poll votes are readable by anyone"
  on public.poll_votes for select to anon, authenticated
  using (poll_id in (select id from public.polls where team_id in (select id from public.teams where is_public = true)));

-- No insert policies on any of the three — creating a poll and voting go
-- through the two RPCs below (same reasoning as create_team/join_team):
-- atomic, and the membership check happens once, server-side, instead of
-- being trusted from the client. Note this also means an anonymous
-- visitor genuinely cannot vote or create a poll: auth.uid() is null for
-- them, so the membership check inside cast_vote/create_poll always
-- fails — the "public" policies above only ever grant SELECT.

create or replace function public.create_poll(target_team_id uuid, poll_question text, option_labels text[])
returns public.polls
language plpgsql
security definer set search_path = public
as $$
declare
  new_poll public.polls;
  lbl text;
  idx int := 0;
begin
  if not exists (
    select 1 from public.team_members
    where team_id = target_team_id and user_id = auth.uid()
  ) then
    raise exception 'not_a_team_member';
  end if;

  if array_length(option_labels, 1) is null or array_length(option_labels, 1) < 2 then
    raise exception 'poll_needs_at_least_two_options';
  end if;

  insert into public.polls (team_id, question, created_by)
  values (target_team_id, poll_question, auth.uid())
  returning * into new_poll;

  foreach lbl in array option_labels loop
    insert into public.poll_options (poll_id, label, position) values (new_poll.id, lbl, idx);
    idx := idx + 1;
  end loop;

  return new_poll;
end;
$$;

create or replace function public.cast_vote(target_poll_id uuid, target_option_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  poll_team uuid;
begin
  select team_id into poll_team from public.polls where id = target_poll_id;

  if poll_team is null or not exists (
    select 1 from public.team_members where team_id = poll_team and user_id = auth.uid()
  ) then
    raise exception 'not_a_team_member';
  end if;

  if not exists (
    select 1 from public.poll_options where id = target_option_id and poll_id = target_poll_id
  ) then
    raise exception 'invalid_option';
  end if;

  insert into public.poll_votes (poll_id, user_id, option_id)
  values (target_poll_id, auth.uid(), target_option_id)
  on conflict (poll_id, user_id) do update set option_id = excluded.option_id, voted_at = now();
end;
$$;

grant execute on function public.create_poll(uuid, text, text[]) to authenticated;
grant execute on function public.cast_vote(uuid, uuid) to authenticated;

-- Aggregated results. security_invoker means this view runs with the
-- caller's own privileges, so it's automatically restricted by the RLS
-- policies above — an anon visitor sees counts only for public teams,
-- exactly like the underlying tables.
create or replace view public.poll_option_results
  with (security_invoker = true) as
  select
    po.id as option_id,
    po.poll_id,
    po.label,
    po.position,
    count(pv.user_id) as vote_count
  from public.poll_options po
  left join public.poll_votes pv on pv.option_id = po.id
  group by po.id, po.poll_id, po.label, po.position;
