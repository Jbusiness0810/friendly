-- =============================================================
-- Friendly: Gender, Group Chats, Private Events
-- Run in Supabase SQL Editor
-- =============================================================

-- Feature 1: Gender column on users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender text;

-- Feature 2: Event visibility + invites
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public';

CREATE TABLE IF NOT EXISTS public.event_invites (
  event_id uuid REFERENCES public.events ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (event_id, user_id)
);

ALTER TABLE public.event_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own invites" ON public.event_invites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Event creators can invite" ON public.event_invites
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.events WHERE id = event_id AND creator_id = auth.uid()
  ));

-- Feature 5: Group chat name
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS group_name text;

-- RPC: get visible events for a user
CREATE OR REPLACE FUNCTION public.get_visible_events(my_id uuid)
RETURNS SETOF public.events AS $$
  SELECT DISTINCT e.* FROM public.events e
  WHERE e.date >= now()
  AND (
    e.visibility = 'public'
    OR e.creator_id = my_id
    OR (e.visibility = 'friends' AND public.is_mutual_match(e.creator_id, my_id))
    OR (e.visibility = 'invite' AND EXISTS (
      SELECT 1 FROM public.event_invites ei WHERE ei.event_id = e.id AND ei.user_id = my_id
    ))
  )
  ORDER BY e.date ASC;
$$ LANGUAGE sql SECURITY DEFINER;

-- RPC: get mutual friends for a user
CREATE OR REPLACE FUNCTION public.get_mutual_friends(my_id uuid)
RETURNS TABLE(id uuid, name text, avatar_url text) AS $$
  SELECT u.id, u.name, u.avatar_url
  FROM public.users u
  WHERE EXISTS (
    SELECT 1 FROM public.waves w1
    JOIN public.waves w2 ON w1.user_id = w2.target_id AND w1.target_id = w2.user_id
    WHERE w1.user_id = my_id AND w1.target_id = u.id
  )
  ORDER BY u.name;
$$ LANGUAGE sql SECURITY DEFINER;
