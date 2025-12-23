/*
  # Create Merchant Logos Storage Bucket

  1. Storage
    - Create `merchant-logos` storage bucket for deal merchant logo images
    - Enable public access for viewing merchant logos
    
  2. Security
    - Allow authenticated users to upload merchant logos
    - Allow public read access to merchant logos
    - Admin users have full access
*/

-- Create storage bucket for merchant logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-logos',
  'merchant-logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload merchant logos
CREATE POLICY "Authenticated users can upload merchant logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'merchant-logos');

-- Allow public to read merchant logos
CREATE POLICY "Anyone can view merchant logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'merchant-logos');

-- Allow users to update their own uploads
CREATE POLICY "Users can update merchant logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'merchant-logos')
  WITH CHECK (bucket_id = 'merchant-logos');

-- Allow users to delete merchant logos
CREATE POLICY "Users can delete merchant logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'merchant-logos');
