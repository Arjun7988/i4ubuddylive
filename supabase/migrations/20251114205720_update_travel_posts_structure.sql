/*
  # Update Travel Posts Structure

  1. Changes
    - Remove old columns: content, image_url
    - Add new columns:
      - destination (text, required)
      - travel_dates (text, optional)
      - description (text, required)
      - budget_range (text, optional)
      - looking_for (text, optional)
      - contact_preference (text, default 'email')

  2. Security
    - Maintains existing RLS policies
    - Preserves relationships with profiles and categories
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'destination'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN destination text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'travel_dates'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN travel_dates text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'description'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'budget_range'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN budget_range text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'looking_for'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN looking_for text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'contact_preference'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN contact_preference text DEFAULT 'email';
  END IF;
END $$;

-- Migrate existing data from content to description
UPDATE travel_posts 
SET description = content, destination = 'Unknown'
WHERE description IS NULL AND content IS NOT NULL;

-- Now make destination and description required (NOT NULL)
ALTER TABLE travel_posts ALTER COLUMN destination SET NOT NULL;
ALTER TABLE travel_posts ALTER COLUMN description SET NOT NULL;

-- Drop old columns
ALTER TABLE travel_posts DROP COLUMN IF EXISTS content;
ALTER TABLE travel_posts DROP COLUMN IF EXISTS image_url;
