/*
  # Create Events Posters Storage Bucket

  1. Storage
    - Create `events-posters` bucket
    - Public read access
    - Authenticated upload access

  2. Security
    - Public users can read files
    - Authenticated users can upload files
    - Users can update/delete their own files
*/

-- Create storage bucket for events posters
INSERT INTO storage.buckets (id, name, public)
VALUES ('events-posters', 'events-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public users can view events posters" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload events posters" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own events posters" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own events posters" ON storage.objects;
END $$;

-- Allow public read access
CREATE POLICY "Public users can view events posters"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'events-posters');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload events posters"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'events-posters');

-- Allow users to update their own files
CREATE POLICY "Users can update own events posters"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'events-posters' AND owner = auth.uid());

-- Allow users to delete their own files
CREATE POLICY "Users can delete own events posters"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'events-posters' AND owner = auth.uid());
