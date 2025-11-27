/*
  # Update Posting Limit to 30-Day Rolling Window Per Post

  1. Changes
    - Remove user_posting_stats table (monthly tracking no longer needed)
    - Each ad slot is available 30 days after that specific post was created
    - Users can post up to 2 ads total, each slot unlocks 30 days after creation
    
  2. New Function: check_user_30day_posting_limit
    - Checks posts created in last 30 days
    - Returns which slots are available and when they unlock
    - Allows user to post if they have less than 2 posts in the last 30 days

  3. Security
    - Function uses authenticated user's ID
    - Returns detailed information about post slots
*/

-- Drop old function and table
DROP FUNCTION IF EXISTS check_user_posting_limit(UUID);
DROP TRIGGER IF EXISTS increment_posting_count_trigger ON classifieds;
DROP FUNCTION IF EXISTS increment_user_posting_count();
DROP TABLE IF EXISTS user_posting_stats;

-- Create new function to check 30-day rolling window
CREATE OR REPLACE FUNCTION check_user_30day_posting_limit(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  recent_posts RECORD;
  post_count INTEGER;
  oldest_post_date TIMESTAMPTZ;
  second_oldest_post_date TIMESTAMPTZ;
  days_until_slot1_unlock INTEGER;
  days_until_slot2_unlock INTEGER;
  can_post BOOLEAN;
  posts_available INTEGER;
  result JSON;
BEGIN
  -- Get posts from last 30 days
  SELECT 
    COUNT(*) as total,
    MIN(created_at) as oldest,
    MAX(CASE WHEN rn = 2 THEN created_at END) as second_oldest
  INTO recent_posts
  FROM (
    SELECT 
      created_at,
      ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
    FROM classifieds
    WHERE created_by_id = user_uuid
      AND created_at > NOW() - INTERVAL '30 days'
  ) subq;
  
  post_count := COALESCE(recent_posts.total, 0);
  oldest_post_date := recent_posts.oldest;
  second_oldest_post_date := recent_posts.second_oldest;
  
  -- Calculate when slots unlock
  IF post_count >= 2 THEN
    can_post := FALSE;
    posts_available := 0;
    -- Slot 1 unlocks 30 days after oldest post
    days_until_slot1_unlock := CEIL(EXTRACT(EPOCH FROM (oldest_post_date + INTERVAL '30 days' - NOW())) / 86400)::INTEGER;
    days_until_slot1_unlock := GREATEST(days_until_slot1_unlock, 0);
    
    -- Slot 2 unlocks 30 days after second post
    IF second_oldest_post_date IS NOT NULL THEN
      days_until_slot2_unlock := CEIL(EXTRACT(EPOCH FROM (second_oldest_post_date + INTERVAL '30 days' - NOW())) / 86400)::INTEGER;
      days_until_slot2_unlock := GREATEST(days_until_slot2_unlock, 0);
    ELSE
      days_until_slot2_unlock := days_until_slot1_unlock;
    END IF;
  ELSIF post_count = 1 THEN
    can_post := TRUE;
    posts_available := 1;
    -- First slot will unlock 30 days after the single post
    days_until_slot1_unlock := CEIL(EXTRACT(EPOCH FROM (oldest_post_date + INTERVAL '30 days' - NOW())) / 86400)::INTEGER;
    days_until_slot1_unlock := GREATEST(days_until_slot1_unlock, 0);
    days_until_slot2_unlock := NULL;
  ELSE
    -- No posts in last 30 days, both slots available
    can_post := TRUE;
    posts_available := 2;
    days_until_slot1_unlock := 0;
    days_until_slot2_unlock := 0;
  END IF;
  
  result := json_build_object(
    'can_post', can_post,
    'posts_available', posts_available,
    'posts_used', post_count,
    'days_until_slot1_unlock', days_until_slot1_unlock,
    'days_until_slot2_unlock', days_until_slot2_unlock,
    'oldest_post_date', oldest_post_date
  );
  
  RETURN result;
END;
$$;
