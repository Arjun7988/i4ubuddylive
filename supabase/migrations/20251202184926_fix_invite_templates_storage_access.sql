/*
  # Fix Invite Templates Storage Access

  1. Storage Policies
    - Allow admins to upload images to invite_templates bucket
    - Allow public read access to all images
    - Allow admins to update and delete images

  2. Security
    - Only authenticated admin users can upload
    - Public can view all images in the bucket
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin users can upload invite template images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view invite template images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update invite template images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete invite template images" ON storage.objects;

-- Allow admins to upload images
CREATE POLICY "Admin users can upload invite template images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invite_templates'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Allow public to view images
CREATE POLICY "Public can view invite template images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'invite_templates');

-- Allow admins to update images
CREATE POLICY "Admin users can update invite template images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invite_templates'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Allow admins to delete images
CREATE POLICY "Admin users can delete invite template images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'invite_templates'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
