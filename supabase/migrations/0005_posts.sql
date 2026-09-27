-- Posts: covers text posts, a title field for longer/article-style
-- writeups, and images. Threading is supported structurally
-- (parent_post_id) even though the composer only writes one post at a
-- time this session — replying to a post is what forms a thread.
-- Video is NOT here — that needs real upload-size/streaming handling
-- this migration deliberately doesn't take on.

create type public.post_kind as enum ('text', 'image');

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  parent_post_id uuid references public.posts (id) on delete cascade,
  kind public.post_kind not null default 'text',
  title text,
  body text,
  media_path text,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "team members can read their team's posts"
  on public.posts for select to authenticated
  using (team_id in (select team_id from public.team_members where user_id = auth.uid()));

create policy "public teams' posts are readable by anyone"
  on public.posts for select to anon, authenticated
  using (team_id in (select id from public.teams where is_public = true));

-- Straightforward single-row insert with a clear ownership check — this
-- one doesn't need the RPC treatment teams/polls needed, since there's
-- no multi-row atomicity concern here.
create policy "team members can post to their teams"
  on public.posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and team_id in (select team_id from public.team_members where user_id = auth.uid())
  );

create policy "authors can delete their own posts"
  on public.posts for delete to authenticated
  using (author_id = auth.uid());

-- Image storage. Bucket is public-read for simplicity — meaning a
-- private team's post images are only as safe as their path being
-- unguessable (paths are UUID-named), not truly access-controlled like
-- the rest of this app. Worth tightening with signed URLs before this
-- is used for anything actually sensitive.
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

create policy "authenticated users can upload post media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'post-media');
