/*
  # Add Admin Write Access for Travel Categories

  1. Changes
    - Add policies to allow public insert/update/delete for admin dashboard
    - Enables full CRUD operations for admin moderation of travel categories
    - Matches the approach used for travel_posts

  2. Security
    - These policies allow public write access at the database level
    - Actual authorization is handled by the custom admin authentication system
    - Admin routes are protected by admin_users/admin_sessions tables
*/

-- Add policy for admin to insert travel categories
CREATE POLICY "Allow admin insert travel categories"
  ON travel_categories
  FOR INSERT
  WITH CHECK (true);

-- Add policy for admin to update travel categories
CREATE POLICY "Allow admin update travel categories"
  ON travel_categories
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add policy for admin to delete travel categories
CREATE POLICY "Allow admin delete travel categories"
  ON travel_categories
  FOR DELETE
  USING (true);
