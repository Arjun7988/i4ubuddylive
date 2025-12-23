/*
  # Add Premium Features to Classifieds

  1. New Columns
    - `zipcode` (text) - Zipcode for approximate location
    - `duration_days` (int) - Duration of the ad (15 or 30 days)
    - `start_date` (timestamptz) - When the ad becomes active
    - `end_date` (timestamptz) - When the ad expires
    - `is_all_cities` (boolean) - If posted in all cities
    - `all_cities_fee` (numeric) - Fee for all cities ($15)
    - `is_top_classified` (boolean) - If it's a top classified ad
    - `is_featured_classified` (boolean) - If it's a featured ad (separate from is_featured)
    - `top_amount` (numeric) - Amount paid for top placement
    - `featured_amount` (numeric) - Amount paid for featured placement
    - `total_amount` (numeric) - Total amount for premium features
    - `terms_accepted` (boolean) - If user accepted terms

  2. Notes
    - Keeps backward compatibility with existing is_featured column
    - is_featured_classified is for the new premium feature
    - is_featured can be used by admin to manually feature ads
    - All premium columns default to false/0 for existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'zipcode'
  ) THEN
    ALTER TABLE classifieds ADD COLUMN zipcode text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE classifieds ADD COLUMN duration_days int DEFAULT 15;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE classifieds ADD COLUMN start_date timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE classifieds ADD COLUMN end_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'is_all_cities'
  ) THEN
    ALTER TABLE classifieds ADD COLUMN is_all_cities boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'all_cities_fee'
  ) THEN
    ALTER TABLE classifieds ADD COLUMN all_cities_fee numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'is_top_classified'
  ) THEN
    ALTER TABLE classifieds ADD COLUMN is_top_classified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'is_featured_classified'
  ) THEN
    ALTER TABLE classifieds ADD COLUMN is_featured_classified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'top_amount'
  ) THEN
    ALTER TABLE classifieds ADD COLUMN top_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'featured_amount'
  ) THEN
    ALTER TABLE classifieds ADD COLUMN featured_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE classifieds ADD COLUMN total_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'terms_accepted'
  ) THEN
    ALTER TABLE classifieds ADD COLUMN terms_accepted boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_classifieds_zipcode ON classifieds(zipcode);
CREATE INDEX IF NOT EXISTS idx_classifieds_is_top ON classifieds(is_top_classified) WHERE is_top_classified = true;
CREATE INDEX IF NOT EXISTS idx_classifieds_is_featured_classified ON classifieds(is_featured_classified) WHERE is_featured_classified = true;
CREATE INDEX IF NOT EXISTS idx_classifieds_end_date ON classifieds(end_date);
CREATE INDEX IF NOT EXISTS idx_classifieds_is_all_cities ON classifieds(is_all_cities) WHERE is_all_cities = true;