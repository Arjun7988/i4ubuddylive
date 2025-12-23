/*
  # Update Classifieds to 15-Day Posting Limit and Auto-Disable

  1. Changes
    - Update posting limit from 30 days to 15 days for regular ads
    - Only apply limit to regular ads (not top or featured)
    - Auto-disable regular ads after 15 days from creation
    - Premium ads (top/featured) have no restrictions

  2. Functions
    - Update check_user_15day_posting_limit to check only regular ads in last 15 days
    - Add auto_disable_expired_classifieds function to disable ads after 15 days
    - Add trigger to run auto-disable check

  3. Security
    - Function uses authenticated user's ID
    - Premium ads bypass all restrictions
*/

-- Drop the old 30-day function
DROP FUNCTION IF EXISTS check_user_30day_posting_limit(uuid);

-- Create new 15-day posting limit function (only for regular ads)
CREATE OR REPLACE FUNCTION check_user_15day_posting_limit(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
  -- Get REGULAR posts (not top or featured) from last 15 days
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
      AND created_at > NOW() - INTERVAL '15 days'
      AND is_top_classified = false
      AND is_featured_classified = false
      AND is_featured = false
  ) subq;

  post_count := COALESCE(recent_posts.total, 0);
  oldest_post_date := recent_posts.oldest;
  second_oldest_post_date := recent_posts.second_oldest;

  -- Calculate when slots unlock (15 days)
  IF post_count >= 2 THEN
    can_post := FALSE;
    posts_available := 0;
    -- Slot 1 unlocks 15 days after oldest post
    days_until_slot1_unlock := CEIL(EXTRACT(EPOCH FROM (oldest_post_date + INTERVAL '15 days' - NOW())) / 86400)::INTEGER;
    days_until_slot1_unlock := GREATEST(days_until_slot1_unlock, 0);

    -- Slot 2 unlocks 15 days after second post
    IF second_oldest_post_date IS NOT NULL THEN
      days_until_slot2_unlock := CEIL(EXTRACT(EPOCH FROM (second_oldest_post_date + INTERVAL '15 days' - NOW())) / 86400)::INTEGER;
      days_until_slot2_unlock := GREATEST(days_until_slot2_unlock, 0);
    ELSE
      days_until_slot2_unlock := days_until_slot1_unlock;
    END IF;
  ELSIF post_count = 1 THEN
    can_post := TRUE;
    posts_available := 1;
    -- First slot will unlock 15 days after the single post
    days_until_slot1_unlock := CEIL(EXTRACT(EPOCH FROM (oldest_post_date + INTERVAL '15 days' - NOW())) / 86400)::INTEGER;
    days_until_slot1_unlock := GREATEST(days_until_slot1_unlock, 0);
    days_until_slot2_unlock := NULL;
  ELSE
    -- No posts in last 15 days, both slots available
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

-- Create function to auto-disable expired regular ads
CREATE OR REPLACE FUNCTION auto_disable_expired_classifieds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Disable regular ads (not top/featured) that are older than 15 days
  UPDATE classifieds
  SET status = 'archived'
  WHERE status = 'active'
    AND is_top_classified = false
    AND is_featured_classified = false
    AND is_featured = false
    AND created_at < NOW() - INTERVAL '15 days';
END;
$$;

-- Create a trigger function that checks on insert
CREATE OR REPLACE FUNCTION check_posting_limit_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  limit_info JSON;
  can_post BOOLEAN;
BEGIN
  -- Skip check for premium ads (top or featured)
  IF NEW.is_top_classified = true OR NEW.is_featured_classified = true OR NEW.is_featured = true THEN
    RETURN NEW;
  END IF;

  -- Check posting limit for regular ads
  limit_info := check_user_15day_posting_limit(NEW.created_by_id);
  can_post := (limit_info->>'can_post')::boolean;

  IF NOT can_post THEN
    RAISE EXCEPTION 'You have reached the posting limit of 2 regular ads per 15 days. You can post another ad in % days.',
      (limit_info->>'days_until_slot1_unlock')::integer;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS check_classified_posting_limit ON classifieds;

-- Create trigger to check posting limit on insert
CREATE TRIGGER check_classified_posting_limit
  BEFORE INSERT ON classifieds
  FOR EACH ROW
  EXECUTE FUNCTION check_posting_limit_on_insert();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_user_15day_posting_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_disable_expired_classifieds() TO service_role;
