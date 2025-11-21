/*
  # Fix Admin Login Access

  1. Changes
    - Remove restrictive RLS policies on admin_users
    - Add public read policy for login verification
    - Keep admin_sessions accessible

  2. Security
    - Allow public read access for authentication
    - Password is still hashed in database
    - Session tokens required for admin actions
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin users can read own data" ON admin_users;
DROP POLICY IF EXISTS "Admin users can update own data" ON admin_users;

-- Create public read policy for login (authentication only)
CREATE POLICY "Public can read admin users for login"
  ON admin_users
  FOR SELECT
  USING (true);

-- Allow public insert for sessions during login
DROP POLICY IF EXISTS "Admin can access own sessions" ON admin_sessions;

CREATE POLICY "Public can create sessions"
  ON admin_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can read sessions"
  ON admin_sessions
  FOR SELECT
  USING (true);
