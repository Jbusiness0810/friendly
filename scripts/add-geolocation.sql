-- Add geolocation columns to users table for proximity features
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS longitude double precision;

-- Index for potential future spatial queries
CREATE INDEX IF NOT EXISTS idx_users_coords
  ON public.users (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
