-- =============================================================
-- Friendly: Account Deletion (Apple App Store Requirement)
-- Run in Supabase SQL Editor
-- =============================================================

-- RPC: delete the currently authenticated user's data
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void AS $$
BEGIN
  -- Remove messages sent by this user
  DELETE FROM public.messages WHERE sender_id = auth.uid();

  -- Remove message read receipts
  DELETE FROM public.message_reads WHERE reader_id = auth.uid();

  -- Remove waves (sent and received)
  DELETE FROM public.waves WHERE user_id = auth.uid() OR target_id = auth.uid();

  -- Remove event RSVPs
  DELETE FROM public.event_rsvps WHERE user_id = auth.uid();

  -- Remove events created by this user
  DELETE FROM public.events WHERE creator_id = auth.uid();

  -- Remove from conversations where user is only participant
  -- For multi-participant convos, remove user from participants array
  UPDATE public.conversations
    SET participants = array_remove(participants, auth.uid()::text)
    WHERE participants @> ARRAY[auth.uid()::text];

  -- Delete empty conversations (no participants left)
  DELETE FROM public.conversations WHERE array_length(participants, 1) IS NULL OR array_length(participants, 1) = 0;

  -- Finally, delete the user profile
  DELETE FROM public.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
