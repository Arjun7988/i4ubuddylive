/*
  # Create Event Invites Storage Bucket

  1. New Bucket
    - `event-invites` bucket for storing customized invite images

  2. Security Policies
    - Authenticated users can upload their own invites
    - Public can view all invites
    - Users can update their own invites
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-invites', 'event-invites', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload own invites'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can upload own invites"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'event-invites' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public can view invites'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public can view invites"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-invites');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can update own invites'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can update own invites"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'event-invites' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;