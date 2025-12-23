/*
  # Fix Travel Post Permissions

  1. Changes
    - Update INSERT policy to allow users without permission records (default allow)
    - If a user doesn't have an entry in travel_post_permissions, they can post
    - If they have an entry, check can_post = true
    
  2. Security
    - Maintains RLS protection
    - Allows new users to post by default
    - Admin can revoke posting permission by setting can_post = false
*/

-- Drop and recreate the INSERT policy for travel posts
DROP POLICY IF EXISTS "Users with permission can create travel posts" ON travel_posts;

CREATE POLICY "Users with permission can create travel posts"
  ON travel_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      -- User has explicit permission
      EXISTS (
        SELECT 1 FROM travel_post_permissions
        WHERE user_id = auth.uid() AND can_post = true
      ) OR
      -- User doesn't have a permission record (default allow)
      NOT EXISTS (
        SELECT 1 FROM travel_post_permissions
        WHERE user_id = auth.uid()
      )
    )
  );
