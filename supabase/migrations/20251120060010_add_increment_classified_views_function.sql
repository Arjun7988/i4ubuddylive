/*
  # Add increment_classified_views function

  1. New Function
    - `increment_classified_views(classified_id)` - Atomically increments the views_count
    
  2. Purpose
    - Safely increment view count for classifieds
    - Prevents race conditions with atomic increment
*/

CREATE OR REPLACE FUNCTION increment_classified_views(classified_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE classifieds
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = classified_id;
END;
$$;
