/*
  # Create Coupons System

  1. New Tables
    - `coupons`
      - `id` (uuid, primary key)
      - `title` (text) - Main coupon title
      - `description` (text) - Detailed description
      - `discount_value` (text) - e.g., "5%", "10%", "$2100"
      - `discount_type` (text) - "Cashback", "OFF", etc.
      - `badge_text` (text) - e.g., "ON THE RISE", "CODE", "DEAL"
      - `badge_color` (text) - Badge background color
      - `expires_at` (timestamptz) - Expiration date
      - `coupon_code` (text, nullable) - Coupon code if applicable
      - `button_text` (text) - CTA button text
      - `button_action` (text) - "show_code", "register", "view_deal"
      - `terms` (text) - Terms and conditions
      - `is_active` (boolean) - Whether coupon is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `coupons` table
    - Add policies for public read access
    - Add policies for authenticated admin users to manage coupons
*/

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  discount_value text NOT NULL,
  discount_type text NOT NULL DEFAULT 'OFF',
  badge_text text,
  badge_color text DEFAULT '#ec4899',
  expires_at timestamptz,
  coupon_code text,
  button_text text NOT NULL DEFAULT 'Get Deal',
  button_action text NOT NULL DEFAULT 'view_deal',
  terms text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON coupons
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert coupons"
  ON coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update coupons"
  ON coupons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete coupons"
  ON coupons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Insert sample coupons
INSERT INTO coupons (title, description, discount_value, discount_type, badge_text, badge_color, expires_at, button_text, button_action, terms) VALUES
(
  'Earn 5% Cashback on Your Orders',
  'instead of 2%',
  '5%',
  'Cashback',
  'ON THE RISE',
  '#3b82f6',
  '2025-12-31 23:59:59',
  'Register for free',
  'register',
  'Get up to 5% cashback on your orders when you shop through our platform. The cashback rate may vary depending on the merchant. Cashback is credited to your account within 30 days of purchase. Customer Requirements: Active account holders. Cashback: 5% on qualifying purchases.'
),
(
  'Up to 10% Off First In-App Purchase',
  NULL,
  '10%',
  'OFF',
  'CODE',
  '#ec4899',
  '2025-12-15 23:59:59',
  'Show coupon code',
  'show_code',
  'Get up to 10% off your first in-app purchase when you shop at Samsung for the latest electronics and phones. The offer may vary from 5% to 10% depending on the offer period. You can go to the Google Play Store or click on the "Get Shop Samsung App" logo at the bottom right of the page to download the app. Customer Requirements: New app users. Discount: 10%'
),
(
  '35% Discount on Galaxy Watch8',
  NULL,
  '35%',
  'OFF',
  'CODE',
  '#ec4899',
  '2025-11-20 23:59:59',
  'Show coupon code',
  'show_code',
  'Save 35% on the latest Galaxy Watch8. Use the coupon code at checkout to redeem this offer. Valid for online purchases only. Customer Requirements: All customers. Discount: 35% off retail price.'
),
(
  'Up to $2100 Off During Black Friday Appliance Deals',
  NULL,
  '$2100',
  'OFF',
  'DEAL',
  '#ec4899',
  '2025-12-06 23:59:59',
  'View deal',
  'view_deal',
  'Save up to $2100 on select appliances during our Black Friday sale. Deals available while supplies last. Free shipping on orders over $500. Customer Requirements: All customers. Savings: Up to $2100 off select appliances.'
);
