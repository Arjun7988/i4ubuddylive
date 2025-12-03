/*
  # Update Classifieds Schema for Simplified Form

  1. Changes
    - Make `category_id` nullable (optional)
    - Make `condition` nullable (optional)
    - Set `currency` default to 'USD' (no longer user selectable)
    - Set `country` default to 'USA' (no longer user selectable)
    - These fields remain in the database but are optional/defaulted in the form

  2. Notes
    - This migration makes the form simpler while keeping the database flexible
    - Existing data is not affected
    - The form now focuses on: title, description, images, price range, location, contact
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE classifieds
      ALTER COLUMN category_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'condition'
  ) THEN
    ALTER TABLE classifieds
      ALTER COLUMN condition DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'currency'
  ) THEN
    ALTER TABLE classifieds
      ALTER COLUMN currency SET DEFAULT 'USD';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classifieds' AND column_name = 'country'
  ) THEN
    ALTER TABLE classifieds
      ALTER COLUMN country SET DEFAULT 'USA';
  END IF;
END $$;
