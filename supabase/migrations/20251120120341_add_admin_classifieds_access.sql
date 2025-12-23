/*
  # Add Admin Access to Classifieds

  1. Changes
    - Add RLS policy to allow admin users to read all classifieds (including pending)
    - Add RLS policy to allow admin users to update any classified status
    
  2. Security
    - Policies check if user is logged in as admin via admin_sessions table
    - This allows admins to manage pending, active, sold, and archived classifieds
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read all classifieds" ON classifieds;
DROP POLICY IF EXISTS "Admins can update any classified" ON classifieds;

-- Allow admins to read all classifieds (including pending ones)
CREATE POLICY "Admins can read all classifieds"
  ON classifieds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_sessions
      WHERE admin_sessions.token = current_setting('request.headers', true)::json->>'x-admin-token'
      AND admin_sessions.expires_at > now()
    )
    OR status = 'active'
    OR auth.uid() = created_by_id
  );

-- Allow admins to update any classified
CREATE POLICY "Admins can update any classified"
  ON classifieds
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_sessions
      WHERE admin_sessions.token = current_setting('request.headers', true)::json->>'x-admin-token'
      AND admin_sessions.expires_at > now()
    )
    OR auth.uid() = created_by_id
  );
