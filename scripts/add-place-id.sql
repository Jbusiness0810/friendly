-- Add place_id column to events table for Google Places integration
-- Run this in the Supabase SQL Editor

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS place_id text;
