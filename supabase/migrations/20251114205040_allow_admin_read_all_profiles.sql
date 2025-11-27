/*
  # Allow Admin to Read All Profiles

  1. Changes
    - Add policy to allow public read access to profiles table
    - This enables the admin dashboard to view all users
    - Maintains existing security for insert/update operations

  2. Security
    - Read-only access for viewing profiles
    - Users can still only update their own profiles
    - Safe for admin dashboard functionality
*/

-- Add policy to allow reading all profiles (for admin dashboard)
CREATE POLICY "Allow public read access to profiles"
  ON profiles
  FOR SELECT
  USING (true);

-- Note: This allows reading profiles but not modifying them
-- Only users can update their own profiles per existing policies
