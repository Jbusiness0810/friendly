-- ============================================================
-- DELETE ALL SEED/DUMMY DATA
-- Run this in the Supabase SQL Editor (one-time operation)
-- ============================================================

DO $$
DECLARE
  seed_ids uuid[] := ARRAY[
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000008'
  ];
BEGIN
  -- Delete messages in conversations involving seed users
  DELETE FROM messages WHERE conversation_id IN (
    SELECT id FROM conversations WHERE participants && seed_ids
  );

  -- Delete conversations involving seed users
  DELETE FROM conversations WHERE participants && seed_ids;

  -- Delete waves from/to seed users
  DELETE FROM waves WHERE user_id = ANY(seed_ids) OR target_id = ANY(seed_ids);

  -- Delete RSVPs for events created by seed users
  DELETE FROM event_rsvps WHERE event_id IN (
    SELECT id FROM events WHERE creator_id = ANY(seed_ids)
  );

  -- Delete events created by seed users
  DELETE FROM events WHERE creator_id = ANY(seed_ids);

  -- Disable triggers to bypass RLS, delete seed users, re-enable
  ALTER TABLE public.users DISABLE TRIGGER ALL;
  DELETE FROM users WHERE id = ANY(seed_ids);
  ALTER TABLE public.users ENABLE TRIGGER ALL;
END $$;
