/*
  # Add Admin Role to Profiles

  1. Changes
    - Add `is_admin` column to profiles table
    - Set default to false
    - Add policy for admins to manage classifieds

  2. Security
    - Only admins can update classified statuses
    - Admins can view all data
*/

-- Add is_admin column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Drop existing policies if they exist and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can update any classified" ON classifieds;
  DROP POLICY IF EXISTS "Admins can view all classifieds" ON classifieds;
END $$;

-- Create admin policies for classifieds
CREATE POLICY "Admins can update any classified"
  ON classifieds
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can view all classifieds"
  ON classifieds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR created_by_id = auth.uid()
    OR status = 'active'
  );
