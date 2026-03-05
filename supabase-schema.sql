-- ============================================================
-- Friendly App — Supabase Database Schema
-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- ============================================================

-- 1. USERS TABLE
-- Stores user profiles created during onboarding
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null default '',
  avatar_url text,
  bio text,
  location text,
  interests text[] not null default '{}',
  intent text[] not null default '{}',
  social_style text,
  fun_fact text,
  ideal_hangouts text[] not null default '{}',
  political_alignment text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Anyone authenticated can read all profiles (for discovery)
create policy "Users are viewable by authenticated users"
  on public.users for select
  using (auth.role() = 'authenticated');

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Users can update only their own profile
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);


-- 2. WAVES TABLE
-- A "wave" is when one user expresses interest in another (like a swipe right)
create table public.waves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  target_id uuid references public.users on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, target_id)
);

alter table public.waves enable row level security;

-- Users can see waves they sent or received
create policy "Users can view own waves"
  on public.waves for select
  using (auth.uid() = user_id or auth.uid() = target_id);

-- Users can send waves
create policy "Users can create waves"
  on public.waves for insert
  with check (auth.uid() = user_id);

-- Users can delete their own waves
create policy "Users can delete own waves"
  on public.waves for delete
  using (auth.uid() = user_id);


-- 3. CONVERSATIONS TABLE
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  type text not null default 'direct' check (type in ('direct', 'group')),
  participants uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

-- Users can view conversations they participate in
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = any(participants));

-- Users can create conversations
create policy "Users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = any(participants));


-- 4. MESSAGES TABLE
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id uuid references public.users on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Users can view messages in conversations they belong to
create policy "Users can view messages in own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where id = conversation_id
      and auth.uid() = any(participants)
    )
  );

-- Users can send messages in conversations they belong to
create policy "Users can send messages in own conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations
      where id = conversation_id
      and auth.uid() = any(participants)
    )
  );


-- 5. EVENTS TABLE
create table public.events (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.users on delete cascade not null,
  title text not null,
  description text,
  location text,
  date timestamptz not null,
  capacity int,
  price text,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- Events are publicly viewable by authenticated users
create policy "Events are viewable by authenticated users"
  on public.events for select
  using (auth.role() = 'authenticated');

-- Users can create events
create policy "Users can create events"
  on public.events for insert
  with check (auth.uid() = creator_id);

-- Users can update their own events
create policy "Users can update own events"
  on public.events for update
  using (auth.uid() = creator_id);

-- Users can delete their own events
create policy "Users can delete own events"
  on public.events for delete
  using (auth.uid() = creator_id);


-- 6. EVENT RSVPS TABLE
create table public.event_rsvps (
  event_id uuid references public.events on delete cascade not null,
  user_id uuid references public.users on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.event_rsvps enable row level security;

-- RSVPs are viewable by authenticated users
create policy "RSVPs are viewable by authenticated users"
  on public.event_rsvps for select
  using (auth.role() = 'authenticated');

-- Users can RSVP
create policy "Users can RSVP"
  on public.event_rsvps for insert
  with check (auth.uid() = user_id);

-- Users can cancel their RSVP
create policy "Users can cancel own RSVP"
  on public.event_rsvps for delete
  using (auth.uid() = user_id);


-- ============================================================
-- HELPER: Function to check if two users have mutual waves (matched)
-- ============================================================
create or replace function public.is_mutual_match(user_a uuid, user_b uuid)
returns boolean as $$
  select exists (
    select 1 from public.waves w1
    join public.waves w2
      on w1.user_id = w2.target_id
      and w1.target_id = w2.user_id
    where w1.user_id = user_a
      and w1.target_id = user_b
  );
$$ language sql security definer;


-- ============================================================
-- INDEX: Speed up common queries
-- ============================================================
create index idx_waves_user_id on public.waves(user_id);
create index idx_waves_target_id on public.waves(target_id);
create index idx_messages_conversation on public.messages(conversation_id, created_at);
create index idx_events_date on public.events(date);
create index idx_event_rsvps_event on public.event_rsvps(event_id);
