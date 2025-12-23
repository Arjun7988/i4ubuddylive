/*
  # Fix Deals RLS for Service Role Operations

  1. Changes
    - Simplify admin policies for deals table
    - Ensure service role can bypass RLS properly
    - Fix WITH CHECK policy to not conflict with service role operations
    
  2. Security
    - Service role can perform all operations (used by edge functions)
    - Authenticated admins can manage deals
    - Public can only view active deals
*/

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all deals" ON deals;
DROP POLICY IF EXISTS "Admins can insert deals" ON deals;
DROP POLICY IF EXISTS "Admins can update deals" ON deals;
DROP POLICY IF EXISTS "Admins can delete deals" ON deals;

-- Recreate simplified admin policies
-- SELECT policy
CREATE POLICY "Admins can view all deals"
  ON deals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- INSERT policy
CREATE POLICY "Admins can insert deals"
  ON deals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR auth.role() = 'service_role'
  );

-- UPDATE policy - simplified to work with service role
CREATE POLICY "Admins can update deals"
  ON deals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR auth.role() = 'service_role'
  );

-- DELETE policy
CREATE POLICY "Admins can delete deals"
  ON deals
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    OR auth.role() = 'service_role'
  );
