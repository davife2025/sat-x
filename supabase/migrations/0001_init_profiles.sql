-- Session 1: theme-agnostic base auth schema only.
-- Teams, team membership, and live-location tables are intentionally NOT
-- created here — they belong to the sessions that build those features
-- (see BUILD_ROADMAP.md). Keeping this migration infra-only means later
-- schema decisions (e.g. how a "team" is modeled) aren't pre-baked.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone signed in can read any profile (this is a social app — profiles
-- are meant to be visible). Writing is restricted to your own row.
create policy "profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth.users row is created, so
-- the app never has to remember to do this itself after sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
