-- Add placeholder avatar photos to test/demo users
-- Uses pravatar.cc for realistic-looking profile pictures
-- Run this in the Supabase SQL Editor

-- Jessica M. (Female, Yoga/Beach)
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/400?img=5'
WHERE id = 'b0000000-0000-0000-0000-000000000001';

-- Ryan K. (Male, Tech/Surfing)
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/400?img=12'
WHERE id = 'b0000000-0000-0000-0000-000000000002';

-- Olivia S. (Female, Design/Pets)
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/400?img=9'
WHERE id = 'b0000000-0000-0000-0000-000000000003';

-- Marcus T. (Male, Fitness/Sports)
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/400?img=11'
WHERE id = 'b0000000-0000-0000-0000-000000000004';

-- Emma C. (Female, Books/Coffee)
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/400?img=20'
WHERE id = 'b0000000-0000-0000-0000-000000000005';

-- Jake P. (Male, Real Estate/Outdoor)
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/400?img=53'
WHERE id = 'b0000000-0000-0000-0000-000000000006';

-- Sophia L. (Female, Art/Nature)
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/400?img=25'
WHERE id = 'b0000000-0000-0000-0000-000000000007';

-- Daniel R. (Male, Finance/Beer)
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/400?img=8'
WHERE id = 'b0000000-0000-0000-0000-000000000008';

-- Ashley W. (Female, Fashion/Wellness)
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/400?img=32'
WHERE id = 'b0000000-0000-0000-0000-000000000009';

-- Chris B. (Male, Tech/Cooking)
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/400?img=57'
WHERE id = 'b0000000-0000-0000-0000-000000000010';
