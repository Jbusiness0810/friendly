-- ============================================================
-- Suggested Events Cron System
-- Generates fresh event suggestions daily and stores them in DB.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Table to store pre-generated suggestions per user
create table if not exists public.suggested_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  template_id text not null,
  title text not null,
  description text,
  location text,
  search_query text,
  date timestamptz not null,
  is_free boolean not null default true,
  score real not null default 0,
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);

-- Index for fast per-user queries
create index if not exists idx_suggested_events_user
  on public.suggested_events(user_id, dismissed, expires_at);

-- RLS: users can only see their own suggestions
alter table public.suggested_events enable row level security;

create policy "Users can view own suggestions"
  on public.suggested_events for select
  using (auth.uid() = user_id);

create policy "Users can update own suggestions"
  on public.suggested_events for update
  using (auth.uid() = user_id);

-- 2. Table to track which template IDs a user has already seen/dismissed
--    (server-side companion to localStorage tracking)
create table if not exists public.dismissed_suggestions (
  user_id uuid references public.users on delete cascade not null,
  suggestion_id text not null, -- template_id or "community-{event_id}"
  dismissed_at timestamptz not null default now(),
  primary key (user_id, suggestion_id)
);

alter table public.dismissed_suggestions enable row level security;

create policy "Users can view own dismissed"
  on public.dismissed_suggestions for select
  using (auth.uid() = user_id);

create policy "Users can insert own dismissed"
  on public.dismissed_suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own dismissed"
  on public.dismissed_suggestions for delete
  using (auth.uid() = user_id);

-- 3. Function to generate suggestions for a single user
--    Called by the cron job for each active user.
--    This does server-side scoring based on interest/hangout/intent matching.
create or replace function public.generate_user_suggestions(target_user_id uuid)
returns void as $$
declare
  user_rec record;
  template record;
  match_score real;
  suggestion_date timestamptz;
  base_offset int := 2;
begin
  -- Get the user's profile
  select * into user_rec from public.users where id = target_user_id;
  if not found then return; end if;

  -- Clean up expired suggestions
  delete from public.suggested_events
    where user_id = target_user_id
    and (expires_at < now() or dismissed = true);

  -- Skip if user already has 6+ active suggestions
  if (select count(*) from public.suggested_events
      where user_id = target_user_id and dismissed = false and expires_at > now()) >= 6
  then return;
  end if;

  -- Template scoring happens in the application layer (TypeScript) because
  -- the template definitions live in client code. This function handles
  -- cleanup and expiration. The actual generation is triggered by the
  -- client calling getSuggestedEvents() which now also persists to this table.
  --
  -- For a fully server-side approach, you would define templates as a
  -- templates table and score them here with array overlap queries.

end;
$$ language plpgsql security definer;

-- 4. Cron job to clean up expired suggestions daily (uses pg_cron extension)
--    Enable pg_cron in Supabase: Database > Extensions > pg_cron
--
-- To set up the cron job, run this AFTER enabling pg_cron:
--
--   select cron.schedule(
--     'cleanup-expired-suggestions',
--     '0 6 * * *',  -- Every day at 6 AM UTC
--     $$
--       delete from public.suggested_events
--       where expires_at < now() or dismissed = true;
--
--       -- Also clean up old dismissed records (older than 30 days)
--       delete from public.dismissed_suggestions
--       where dismissed_at < now() - interval '30 days';
--     $$
--   );

-- 5. Helper: Reset a user's dismissed suggestions (fresh start)
create or replace function public.reset_dismissed_suggestions(target_user_id uuid)
returns void as $$
begin
  delete from public.dismissed_suggestions where user_id = target_user_id;
end;
$$ language plpgsql security definer;
