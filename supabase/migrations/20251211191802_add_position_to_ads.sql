/*
  # Add Position Field to Ads Table

  1. Changes
    - Add `position` column to `ads` table (integer, default 0)
    - Add index on position for sorting
    - Lower position numbers display first (1, 2, 3...)

  2. Purpose
    - Allow admins to control display order of ads
    - Position 1-100 controls sort order
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ads' AND column_name = 'position'
  ) THEN
    ALTER TABLE ads ADD COLUMN position integer DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(position);
  END IF;
END $$;