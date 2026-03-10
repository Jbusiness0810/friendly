-- Add place_id column to events table (so Google Places photos can be fetched accurately)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS place_id text;

-- Event photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload event photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view event photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-photos');
