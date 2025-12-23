/*
  # Fix Travel Categories Access for Admin Dashboard - Public Role

  1. Changes
    - Drop anon-specific policies
    - Add policies for public role (which anon inherits from)
    - This allows the admin dashboard to manage categories

  2. Security Note
    - These policies allow public write access at the database level
    - Authorization is handled by the custom admin authentication system
    - Admin routes are protected by admin_users/admin_sessions tables
*/

-- Drop existing anon policies
DROP POLICY IF EXISTS "Anon can insert travel categories" ON travel_categories;
DROP POLICY IF EXISTS "Anon can update travel categories" ON travel_categories;
DROP POLICY IF EXISTS "Anon can delete travel categories" ON travel_categories;

-- Create policies for public role
CREATE POLICY "Public can insert travel categories"
  ON travel_categories
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update travel categories"
  ON travel_categories
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete travel categories"
  ON travel_categories
  FOR DELETE
  TO public
  USING (true);
