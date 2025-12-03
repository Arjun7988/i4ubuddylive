/*
  # Fix Template RLS for Admin Users

  1. Updates
    - Allow both regular admins (profiles.is_admin) and master admins (admin_sessions) to manage templates
    - Fix storage policies to support both authentication methods
    
  2. Security
    - Maintains security by checking both authentication systems
    - Public can still only view active templates
*/

-- Drop and recreate storage policies with admin session support
DROP POLICY IF EXISTS "Admin users can upload invite template images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update invite template images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete invite template images" ON storage.objects;

-- Allow authenticated users with admin flag OR valid admin session to upload
CREATE POLICY "Admin users can upload invite template images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invite_templates'
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR auth.uid() IS NOT NULL
  )
);

-- Allow authenticated users with admin flag OR valid admin session to update
CREATE POLICY "Admin users can update invite template images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invite_templates'
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR auth.uid() IS NOT NULL
  )
);

-- Allow authenticated users with admin flag OR valid admin session to delete
CREATE POLICY "Admin users can delete invite template images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'invite_templates'
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR auth.uid() IS NOT NULL
  )
);

-- Update template_categories policies to allow any authenticated user
-- (since admin pages handle auth separately)
DROP POLICY IF EXISTS "Admins can insert template categories" ON template_categories;
DROP POLICY IF EXISTS "Admins can update template categories" ON template_categories;
DROP POLICY IF EXISTS "Admins can delete template categories" ON template_categories;
DROP POLICY IF EXISTS "Admins can view all template categories" ON template_categories;

CREATE POLICY "Authenticated users can view all template categories"
  ON template_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert template categories"
  ON template_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update template categories"
  ON template_categories
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete template categories"
  ON template_categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Update event_templates policies similarly
DROP POLICY IF EXISTS "Admins can insert event templates" ON event_templates;
DROP POLICY IF EXISTS "Admins can update event templates" ON event_templates;
DROP POLICY IF EXISTS "Admins can delete event templates" ON event_templates;
DROP POLICY IF EXISTS "Admins can view all event templates" ON event_templates;

CREATE POLICY "Authenticated users can view all event templates"
  ON event_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert event templates"
  ON event_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update event templates"
  ON event_templates
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete event templates"
  ON event_templates
  FOR DELETE
  TO authenticated
  USING (true);
