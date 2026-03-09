-- =============================================================
-- Friendly: Test seed data for app testing
-- Run in Supabase SQL Editor
-- Creates 10 fake users in Newport Beach / Costa Mesa area
-- =============================================================

-- 1) Insert auth.users entries (required due to foreign key)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jessica.m.test@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ryan.k.test@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'olivia.s.test@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('b0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcus.t.test@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('b0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emma.c.test@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('b0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jake.p.test@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('b0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sophia.l.test@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('b0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'daniel.r.test@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('b0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ashley.w.test@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
  ('b0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'chris.b.test@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}')
ON CONFLICT (id) DO NOTHING;

-- 2) Insert public.users profiles
INSERT INTO public.users (id, email, name, bio, location, interests, intent, social_style, fun_fact, ideal_hangouts, political_alignment, verified)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'jessica.m.test@example.com',
    'Jessica M.',
    'Yoga instructor and smoothie bowl addict. Recently moved to Newport and loving the beach lifestyle!',
    'Newport Beach',
    ARRAY['Yoga', 'Cooking', 'Beach', 'Wellness'],
    ARRAY['Casual hangouts', 'Workout buddies'],
    'One-on-one',
    'I can hold a headstand for 5 minutes',
    ARRAY['Coffee shops', 'Beach', 'Hiking trails'],
    'Moderate',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'ryan.k.test@example.com',
    'Ryan K.',
    'Tech entrepreneur working from home. Always down for a surf session or grabbing tacos.',
    'Costa Mesa',
    ARRAY['Surfing', 'Technology', 'Food', 'Fitness'],
    ARRAY['Casual hangouts', 'Networking'],
    'Small groups',
    'Caught a 10-foot wave at the Wedge last summer',
    ARRAY['Beach', 'Restaurants', 'Coffee shops'],
    'Conservative',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'olivia.s.test@example.com',
    'Olivia S.',
    'Interior designer with a golden retriever named Biscuit. Love exploring new restaurants!',
    'Newport Beach',
    ARRAY['Pets', 'Art', 'Food', 'Design'],
    ARRAY['Casual hangouts', 'Dog park friends'],
    'Small groups',
    'Biscuit has his own Instagram with 2k followers',
    ARRAY['Dog parks', 'Restaurants', 'Art galleries'],
    'Moderate',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'marcus.t.test@example.com',
    'Marcus T.',
    'Former college athlete turned fitness coach. Big into community and helping people reach their goals.',
    'Costa Mesa',
    ARRAY['Fitness', 'Sports', 'Nutrition', 'Music'],
    ARRAY['Workout buddies', 'Casual hangouts'],
    'Big groups',
    'Ran the Boston Marathon twice',
    ARRAY['Gym', 'Parks', 'Sports bars'],
    'Conservative',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'emma.c.test@example.com',
    'Emma C.',
    'Bookworm and craft coffee snob. Looking for people to explore Costa Mesa''s food scene with.',
    'Costa Mesa',
    ARRAY['Reading', 'Coffee', 'Food', 'Walking'],
    ARRAY['Casual hangouts', 'Book club'],
    'One-on-one',
    'I''ve visited 47 coffee shops in Orange County',
    ARRAY['Coffee shops', 'Bookstores', 'Restaurants'],
    'Liberal',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'jake.p.test@example.com',
    'Jake P.',
    'Real estate agent and weekend warrior. Paddleboarding, hiking, you name it. Let''s hang!',
    'Newport Beach',
    ARRAY['Paddleboarding', 'Hiking', 'Real Estate', 'Golf'],
    ARRAY['Casual hangouts', 'Networking'],
    'Big groups',
    'Sold a house to a celebrity (can''t say who)',
    ARRAY['Beach', 'Hiking trails', 'Golf courses'],
    'Conservative',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000007',
    'sophia.l.test@example.com',
    'Sophia L.',
    'Nurse by day, painter by night. Looking for creative souls and hiking buddies in the area.',
    'Newport Beach',
    ARRAY['Art', 'Hiking', 'Wellness', 'Photography'],
    ARRAY['Casual hangouts', 'Creative projects'],
    'Small groups',
    'Had a painting displayed at Laguna Art-A-Fair',
    ARRAY['Art galleries', 'Hiking trails', 'Parks'],
    'Moderate',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000008',
    'daniel.r.test@example.com',
    'Daniel R.',
    'Finance bro who actually likes talking about things other than finance. Craft beer enthusiast.',
    'Costa Mesa',
    ARRAY['Craft Beer', 'Sports', 'Travel', 'Cooking'],
    ARRAY['Casual hangouts', 'Sports leagues'],
    'Big groups',
    'Brewed my own IPA and it was actually drinkable',
    ARRAY['Breweries', 'Sports bars', 'Restaurants'],
    'Conservative',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000009',
    'ashley.w.test@example.com',
    'Ashley W.',
    'Marketing manager and pilates enthusiast. New to the area and looking to build my crew!',
    'Newport Beach',
    ARRAY['Pilates', 'Fashion', 'Beach', 'Wine'],
    ARRAY['Casual hangouts', 'Workout buddies'],
    'Small groups',
    'Can name any wine region just by tasting',
    ARRAY['Beach', 'Wine bars', 'Pilates studios'],
    'Moderate',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000010',
    'chris.b.test@example.com',
    'Chris B.',
    'Software engineer and amateur chef. Always experimenting with new recipes and looking for taste testers!',
    'Costa Mesa',
    ARRAY['Cooking', 'Technology', 'Gaming', 'Running'],
    ARRAY['Casual hangouts', 'Dinner parties'],
    'Small groups',
    'Made a sourdough starter that''s been alive for 3 years',
    ARRAY['Restaurants', 'Coffee shops', 'Parks'],
    'Liberal',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 3) Create some waves to test matching
-- (Waves FROM test users TO each other, so you can see "Matched" and "Waved" states)

-- Mutual waves (these pairs are matched):
INSERT INTO public.waves (user_id, target_id) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004'),
  ('b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000008'),
  ('b0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000006')
ON CONFLICT (user_id, target_id) DO NOTHING;

-- One-way waves (not yet matched):
INSERT INTO public.waves (user_id, target_id) VALUES
  ('b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000007'),
  ('b0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002')
ON CONFLICT (user_id, target_id) DO NOTHING;

-- 4) Create a sample conversation between matched users
INSERT INTO public.conversations (id, type, participants)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'direct', ARRAY['b0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid]),
  ('c0000000-0000-0000-0000-000000000002', 'direct', ARRAY['b0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000004'::uuid])
ON CONFLICT (id) DO NOTHING;

-- 5) Add sample messages
INSERT INTO public.messages (conversation_id, sender_id, content, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Hey Olivia! Love that you have a golden retriever. Where do you usually take Biscuit for walks?', now() - interval '2 hours'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Hi Jessica! We usually go to the Newport Back Bay trail. Biscuit loves it there! You should come sometime 🐕', now() - interval '1 hour'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'That sounds amazing! I do yoga near there in the mornings. Would love to join you both for a walk after!', now() - interval '30 minutes'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Marcus! Just saw you''re into fitness coaching. I''ve been looking for a surf buddy who also hits the gym. What''s your schedule like?', now() - interval '3 hours'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'Hey Ryan! I usually train mornings around 6-8am. Would totally be down for a dawn patrol surf session followed by a gym sesh. What break do you usually go to?', now() - interval '2 hours');

-- 6) Create a sample event
INSERT INTO public.events (id, creator_id, title, description, location, date, capacity, price)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'Morning Beach Bootcamp', 'Free community workout on the beach! All fitness levels welcome. Bring water and a towel.', 'Corona del Mar State Beach', now() + interval '3 days', 20, 'Free'),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000008', 'Craft Beer & Tacos Night', 'Let''s check out the new brewery in Costa Mesa. First round is on me!', 'Salty Bear Brewing, Costa Mesa', now() + interval '5 days', 12, '$15-25'),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000007', 'Sunset Hike at Crystal Cove', 'Easy-moderate hike with ocean views. We''ll catch the sunset at the top!', 'Crystal Cove State Park', now() + interval '7 days', 15, 'Free (parking $15)')
ON CONFLICT (id) DO NOTHING;

-- RSVP some users to events
INSERT INTO public.event_rsvps (event_id, user_id) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006'),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006'),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000010'),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003'),
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000009')
ON CONFLICT (event_id, user_id) DO NOTHING;
