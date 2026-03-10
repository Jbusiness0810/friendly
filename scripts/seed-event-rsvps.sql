-- =============================================================
-- Seed: RSVP test users to ALL existing events
-- Run in Supabase SQL Editor after seed-test-users.sql
-- Randomly assigns 3-6 test users to each existing event
-- =============================================================

-- Get all event IDs and randomly assign test users
INSERT INTO public.event_rsvps (event_id, user_id)
SELECT e.id, u.id
FROM public.events e
CROSS JOIN (
  SELECT id, row_number() OVER (ORDER BY random()) as rn
  FROM public.users
  WHERE id IN (
    'b0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000007',
    'b0000000-0000-0000-0000-000000000008',
    'b0000000-0000-0000-0000-000000000009',
    'b0000000-0000-0000-0000-000000000010'
  )
) u
WHERE u.rn <= 3 + floor(random() * 4)  -- 3 to 6 users per event
ON CONFLICT (event_id, user_id) DO NOTHING;
