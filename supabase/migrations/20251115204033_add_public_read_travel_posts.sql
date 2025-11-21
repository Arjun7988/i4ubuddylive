/*
  # Add Public Read Access for Travel Posts (Admin Support)

  1. Changes
    - Add policy to allow public/unauthenticated read access to travel_posts
    - This enables admin dashboard to view all travel posts without Supabase Auth
    - Maintains existing security for write operations (insert/update/delete)

  2. Security
    - Only SELECT operations are public
    - All write operations still require authentication and ownership checks
    - Admin can view all posts for moderation purposes
*/

-- Drop existing restrictive policy if needed
DROP POLICY IF EXISTS "Authenticated users can view travel posts" ON travel_posts;

-- Add public read access policy
CREATE POLICY "Allow public read access to travel posts"
  ON travel_posts
  FOR SELECT
  USING (true);

-- Keep existing write policies intact (they require authentication)
