/*
  # Create Deal Images Storage Bucket

  1. New Storage Bucket
    - `deal-images` bucket for storing deal banner images
    - Public read access for all users
    - Authenticated users can upload images

  2. Security
    - Enable RLS on storage.objects
    - Public SELECT policy for viewing images
    - Authenticated users can INSERT/UPDATE/DELETE their uploads
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-images', 'deal-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Deal images are publicly accessible'
  ) THEN
    CREATE POLICY "Deal images are publicly accessible"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'deal-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload deal images'
  ) THEN
    CREATE POLICY "Authenticated users can upload deal images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'deal-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update deal images'
  ) THEN
    CREATE POLICY "Authenticated users can update deal images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'deal-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete deal images'
  ) THEN
    CREATE POLICY "Authenticated users can delete deal images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'deal-images');
  END IF;
END $$;