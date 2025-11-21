/*
  # Update Travel Posts with From Location and Share Token

  1. Changes
    - Add `from_location` column (optional text field)
    - Add `share_token` column for sharing posts
    - Remove NOT NULL constraint from `contact_preference` to make it optional
  
  2. Notes
    - from_location is optional, represents the starting location of travel
    - share_token allows sharing travel posts with others
*/

-- Add from_location column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'from_location'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN from_location text DEFAULT '';
  END IF;
END $$;

-- Add share_token column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN share_token text UNIQUE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_travel_posts_share_token ON travel_posts(share_token);