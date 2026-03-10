-- Chat enhancements: read receipts, message types, soft delete
-- Run this in the Supabase SQL Editor

-- Read receipts table
CREATE TABLE public.message_reads (
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  reader_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  last_read_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (conversation_id, reader_id)
);

ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reads" ON public.message_reads
  FOR ALL USING (auth.uid() = reader_id);

CREATE POLICY "Participants can view reads" ON public.message_reads
  FOR SELECT USING (
    auth.uid() IN (
      SELECT unnest(participants) FROM public.conversations WHERE id = conversation_id
    )
  );

-- Message type and media support
ALTER TABLE public.messages ADD COLUMN type text DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN media_url text;

-- Soft delete for messages
ALTER TABLE public.messages ADD COLUMN deleted_at timestamptz;

-- Allow users to soft-delete own messages
CREATE POLICY "Users can soft-delete own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

-- Chat images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload chat images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view chat images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');
