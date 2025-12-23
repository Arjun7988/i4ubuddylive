/*
  # Fix Buddy Service Admin RLS Policies

  1. Problem
    - Admin authentication uses admin_users table
    - RLS policies check profiles.is_admin which doesn't exist for admin users
    - This causes "row violates row-level security policy" errors
  
  2. Solution
    - Update RLS policies to check admin_users table OR profiles.is_admin
    - This allows both regular admins and admin_users to manage requests
  
  3. Changes
    - Drop existing admin policies
    - Create new policies that check both admin_users and profiles tables
*/

-- Drop existing admin policies for buddy_service_requests
DROP POLICY IF EXISTS "Admins can view all requests" ON buddy_service_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON buddy_service_requests;
DROP POLICY IF EXISTS "Admins can delete requests" ON buddy_service_requests;

-- Drop existing admin policies for buddy_service_listings
DROP POLICY IF EXISTS "Admins can view all listings" ON buddy_service_listings;
DROP POLICY IF EXISTS "Admins can create listings" ON buddy_service_listings;
DROP POLICY IF EXISTS "Admins can update listings" ON buddy_service_listings;
DROP POLICY IF EXISTS "Admins can delete listings" ON buddy_service_listings;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean AS $$
BEGIN
  -- Check if user exists in admin_users table OR has is_admin in profiles
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate admin policies for buddy_service_requests using the helper function

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
  ON buddy_service_requests FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Admins can update all requests
CREATE POLICY "Admins can update all requests"
  ON buddy_service_requests FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Admins can delete requests
CREATE POLICY "Admins can delete requests"
  ON buddy_service_requests FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- Recreate admin policies for buddy_service_listings using the helper function

-- Admins can view all listings
CREATE POLICY "Admins can view all listings"
  ON buddy_service_listings FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Admins can create listings
CREATE POLICY "Admins can create listings"
  ON buddy_service_listings FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

-- Admins can update listings
CREATE POLICY "Admins can update listings"
  ON buddy_service_listings FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Admins can delete listings
CREATE POLICY "Admins can delete listings"
  ON buddy_service_listings FOR DELETE
  TO authenticated
  USING (is_admin_user());
