/*
  # Add Share Token to Split Expenses

  1. Changes
    - Add `share_token` column to `split_expenses` table
      - Allows sharing split expense details with friends
      - Similar to RSVP events share functionality
    
  2. Notes
    - Share token is optional and unique when set
    - Can be used to create shareable links for split expenses
*/

-- Add share_token column to split_expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'split_expenses' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE split_expenses ADD COLUMN share_token text UNIQUE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_split_expenses_share_token ON split_expenses(share_token);