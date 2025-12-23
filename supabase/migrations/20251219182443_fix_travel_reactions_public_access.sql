/*
  # Fix Travel Post Reactions for Public Access
  
  1. Changes
    - Allow public read access to travel_post_reactions
    - This enables non-logged-in users to see reaction counts
    - Maintains authentication requirements for adding/removing reactions
    
  2. Security
    - Only SELECT operations are public
    - INSERT and DELETE still require authentication
    - Users can only add/remove their own reactions
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view reactions" ON travel_post_reactions;

-- Add public read access policy
CREATE POLICY "Allow public read access to reactions"
  ON travel_post_reactions
  FOR SELECT
  USING (true);

-- Keep existing write policies intact (they require authentication)
