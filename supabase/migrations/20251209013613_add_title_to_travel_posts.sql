/*
  # Add Title Column to Travel Posts

  1. Changes
    - Add `title` column (text, optional) - Short heading/title for travel posts
  
  2. Notes
    - Title is primarily used for Flight Travel posts
    - Existing posts will have NULL values for title
    - Title can be used for any travel post type as a short headline
*/

-- Add title column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'title'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN title text;
  END IF;
END $$;

-- Create index for searching by title
CREATE INDEX IF NOT EXISTS idx_travel_posts_title ON travel_posts(title);
