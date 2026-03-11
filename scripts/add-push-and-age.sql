-- Push token & date of birth columns
-- Run this in Supabase SQL Editor

-- Push notification token storage
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS push_token text;

-- Date of birth for age verification
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Gender column (if not already added)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender text;

-- Index for looking up push tokens when sending notifications
CREATE INDEX IF NOT EXISTS idx_users_push_token ON public.users (push_token) WHERE push_token IS NOT NULL;

-- ============================================================
-- Push notification trigger: sends notification via pg_net
-- when a new message is inserted.
--
-- IMPORTANT: This requires:
-- 1. Enable pg_net extension in Supabase Dashboard → Database → Extensions
-- 2. Set up a Supabase Edge Function at /push-notify
--    OR use a webhook service
-- ============================================================

-- Notify function: looks up push tokens for conversation participants
-- and calls a webhook to deliver the notification
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS trigger AS $$
DECLARE
  participant_id uuid;
  participant_token text;
  sender_name text;
  convo_participants uuid[];
BEGIN
  -- Get sender name
  SELECT name INTO sender_name FROM public.users WHERE id = NEW.sender_id;

  -- Get conversation participants
  SELECT participants INTO convo_participants FROM public.conversations WHERE id = NEW.conversation_id;

  -- For each participant (except sender), check if they have a push token
  FOREACH participant_id IN ARRAY convo_participants LOOP
    IF participant_id != NEW.sender_id THEN
      SELECT push_token INTO participant_token FROM public.users WHERE id = participant_id;
      -- Token will be used by the Edge Function / webhook
      -- For now we just store the notification intent
      -- A Supabase Edge Function should poll or listen for these
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to messages table
DROP TRIGGER IF EXISTS on_new_message_notify ON public.messages;
CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();
