/*
  # Add Monthly Posting Limits for Classifieds

  1. Changes to classifieds table
    - Set new classifieds to 'pending' status by default instead of 'active'
    - This allows auto-deactivation after posting

  2. New Table: user_posting_stats
    - Tracks monthly posting counts per user
    - Stores first post date of current month
    - Enables limiting users to 2 free posts per month

  3. New Function: check_user_posting_limit
    - Returns remaining posts allowed and days until reset
    - Used before allowing new post creation

  4. Security
    - Enable RLS on user_posting_stats table
    - Users can only read/update their own posting stats
*/

-- Create user_posting_stats table
CREATE TABLE IF NOT EXISTS user_posting_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_month_posts INTEGER DEFAULT 0,
  first_post_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_posting_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own posting stats"
  ON user_posting_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posting stats"
  ON user_posting_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posting stats"
  ON user_posting_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to check posting limit
CREATE OR REPLACE FUNCTION check_user_posting_limit(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  stats RECORD;
  current_date DATE := CURRENT_DATE;
  first_of_month DATE;
  days_until_reset INTEGER;
  posts_remaining INTEGER;
  result JSON;
BEGIN
  first_of_month := DATE_TRUNC('month', current_date);
  
  -- Get or create user stats
  SELECT * INTO stats FROM user_posting_stats WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    -- First time poster
    INSERT INTO user_posting_stats (user_id, current_month_posts, first_post_date)
    VALUES (user_uuid, 0, NULL)
    RETURNING * INTO stats;
  END IF;
  
  -- Check if we're in a new month
  IF stats.first_post_date IS NULL OR DATE_TRUNC('month', stats.first_post_date) < first_of_month THEN
    -- Reset for new month
    posts_remaining := 2;
    days_until_reset := 0;
  ELSE
    -- Same month, check remaining posts
    posts_remaining := GREATEST(0, 2 - stats.current_month_posts);
    
    -- Calculate days until next month
    days_until_reset := (DATE_TRUNC('month', current_date) + INTERVAL '1 month')::DATE - current_date;
  END IF;
  
  result := json_build_object(
    'can_post', posts_remaining > 0,
    'posts_remaining', posts_remaining,
    'days_until_reset', days_until_reset,
    'current_month_posts', stats.current_month_posts
  );
  
  RETURN result;
END;
$$;

-- Function to increment posting count
CREATE OR REPLACE FUNCTION increment_user_posting_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  first_of_month DATE;
BEGIN
  first_of_month := DATE_TRUNC('month', CURRENT_DATE);
  
  -- Insert or update posting stats
  INSERT INTO user_posting_stats (user_id, current_month_posts, first_post_date, updated_at)
  VALUES (NEW.created_by_id, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    current_month_posts = CASE
      WHEN DATE_TRUNC('month', user_posting_stats.first_post_date) < first_of_month THEN 1
      ELSE user_posting_stats.current_month_posts + 1
    END,
    first_post_date = CASE
      WHEN DATE_TRUNC('month', user_posting_stats.first_post_date) < first_of_month THEN CURRENT_TIMESTAMP
      ELSE user_posting_stats.first_post_date
    END,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-increment posting count
DROP TRIGGER IF EXISTS increment_posting_count_trigger ON classifieds;
CREATE TRIGGER increment_posting_count_trigger
  AFTER INSERT ON classifieds
  FOR EACH ROW
  EXECUTE FUNCTION increment_user_posting_count();

-- Update default status for new classifieds to 'pending'
ALTER TABLE classifieds 
  ALTER COLUMN status SET DEFAULT 'pending';
