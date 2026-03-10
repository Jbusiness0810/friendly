-- =============================================================
-- Friendly: Event Group Chats + Group Names
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- =============================================================

-- 1. Add group_name to conversations (for display in Chat)
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS group_name text;

-- 2. Create event_conversations linking table
--    Links each event to its group chat conversation
CREATE TABLE IF NOT EXISTS public.event_conversations (
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.event_conversations ENABLE ROW LEVEL SECURITY;

-- Everyone can see which events have group chats
CREATE POLICY "Anyone can view event conversations"
  ON public.event_conversations FOR SELECT USING (true);

-- Authenticated users can create event-conversation links
CREATE POLICY "Authenticated users can create event conversations"
  ON public.event_conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
