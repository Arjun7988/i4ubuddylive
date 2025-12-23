/*
  # Update Coupons Table for Simplified Admin Management

  1. Changes
    - Simplify coupons table to focus on:
      - percentage (discount_percentage numeric field)
      - title (text)
      - until_date (expires_at timestamptz)
      - terms (text field for rich text content)
      - coupon_code (text)
    - Keep existing fields for backward compatibility
    - Add admin policy to view all coupons (active and inactive)

  2. Security
    - Add policy for admins to view all coupons regardless of active status
*/

-- Add discount_percentage field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'discount_percentage'
  ) THEN
    ALTER TABLE coupons ADD COLUMN discount_percentage numeric(5,2);
  END IF;
END $$;

-- Update existing records to populate discount_percentage from discount_value
UPDATE coupons
SET discount_percentage = CASE
  WHEN discount_value LIKE '%\%%' THEN CAST(REPLACE(discount_value, '%', '') AS numeric)
  ELSE NULL
END
WHERE discount_percentage IS NULL AND discount_value LIKE '%\%%';

-- Add policy for admins to view all coupons (including inactive)
CREATE POLICY "Admins can view all coupons"
  ON coupons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
