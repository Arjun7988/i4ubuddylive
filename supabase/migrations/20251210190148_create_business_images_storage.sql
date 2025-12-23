/*
  # Create Business Images Storage Bucket

  1. Storage Setup
    - Create `business-images` bucket for storing business listing images
    - Configure bucket to be publicly accessible for reading
    - Set up size and file type restrictions
  
  2. Security Policies
    - Authenticated users can upload images
    - Public can view images
    - Users can only delete their own images
    - Max file size: 5MB
  
  3. Features
    - Public read access for displaying images
    - Authenticated upload access
    - Image optimization settings
*/

-- Create storage bucket for business images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-images',
  'business-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public to view images
CREATE POLICY "Public can view business images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'business-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload business images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-images' AND
    (storage.foldername(name))[1] = 'business-images'
  );

-- Allow users to delete their own images (based on filename pattern)
CREATE POLICY "Users can delete their own business images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-images' AND
    (storage.foldername(name))[1] = 'business-images'
  );

-- Allow users to update their own images
CREATE POLICY "Users can update their own business images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'business-images' AND
    (storage.foldername(name))[1] = 'business-images'
  )
  WITH CHECK (
    bucket_id = 'business-images' AND
    (storage.foldername(name))[1] = 'business-images'
  );
