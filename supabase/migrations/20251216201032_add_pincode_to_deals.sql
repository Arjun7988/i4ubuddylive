/*
  # Add pincode field to deals table

  1. Changes
    - Add `pincode` column to `deals` table for location-based filtering
    - Add `city` and `state` columns to support location details
    - Add index on pincode for faster location-based queries
  
  2. Purpose
    - Enable pincode-based deal filtering for users
    - Allow nearby deals to be shown based on user's pincode
    - Improve location targeting for deals
*/

-- Add pincode and location fields to deals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'pincode'
  ) THEN
    ALTER TABLE deals ADD COLUMN pincode text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'city'
  ) THEN
    ALTER TABLE deals ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'state'
  ) THEN
    ALTER TABLE deals ADD COLUMN state text;
  END IF;
END $$;

-- Add index on pincode for faster queries
CREATE INDEX IF NOT EXISTS idx_deals_pincode ON deals(pincode) WHERE pincode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_city ON deals(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_is_active ON deals(is_active) WHERE is_active = true;
