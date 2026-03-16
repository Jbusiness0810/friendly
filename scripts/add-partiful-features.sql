-- ============================================================
-- Friendly App — Partiful-style Event Features Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add RSVP status + guest_count to event_rsvps
-- status: 'going', 'maybe', 'cant_go'
-- guest_count: how many plus-ones (0 = just the user)
ALTER TABLE public.event_rsvps
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'going'
    CHECK (status IN ('going', 'maybe', 'cant_go')),
  ADD COLUMN IF NOT EXISTS guest_count int NOT NULL DEFAULT 0;

-- 2. Add theme + co-host support to events
-- theme: preset theme name (e.g. 'sunset', 'neon', 'garden', 'minimal')
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'default';

-- 3. Event comments table (the "wall")
CREATE TABLE IF NOT EXISTS public.event_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.events ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- Comments are viewable by authenticated users
CREATE POLICY "Event comments are viewable by authenticated users"
  ON public.event_comments FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can post comments
CREATE POLICY "Users can post event comments"
  ON public.event_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own event comments"
  ON public.event_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast comment lookups
CREATE INDEX IF NOT EXISTS idx_event_comments_event
  ON public.event_comments(event_id, created_at);
