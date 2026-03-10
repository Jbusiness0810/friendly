-- Block & Report tables for user safety
-- Run this in the Supabase SQL Editor

CREATE TABLE public.blocks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  blocked_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);

CREATE TABLE public.reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own blocks" ON public.blocks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE INDEX idx_blocks_user ON public.blocks(user_id);
CREATE INDEX idx_blocks_blocked ON public.blocks(blocked_user_id);
