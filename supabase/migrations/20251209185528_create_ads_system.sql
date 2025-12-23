/*
  # Create Ads System for Classifieds Page

  1. New Tables
    - `ads`
      - `id` (uuid, primary key)
      - `title` (text, nullable) - Optional title for the ad
      - `image_url` (text, required) - Main image URL for the ad display
      - `full_image_url` (text, nullable) - Full-size image for popup display
      - `click_action_type` (text, required) - Action type: NONE, OPEN_LINK, OPEN_POPUP
      - `redirect_url` (text, nullable) - URL to open when clicked (for OPEN_LINK)
      - `page` (text, required) - Page where ad appears (e.g., CLASSIFIEDS)
      - `placement` (text, required) - Specific placement on page
      - `active` (boolean, default true) - Whether ad is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ads` table
    - Add policy for public read access to active ads
    - Add policy for admin users to manage ads
*/

-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  image_url text NOT NULL,
  full_image_url text,
  click_action_type text NOT NULL CHECK (click_action_type IN ('NONE', 'OPEN_LINK', 'OPEN_POPUP')),
  redirect_url text,
  page text NOT NULL,
  placement text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Public can read active ads
CREATE POLICY "Public can view active ads"
  ON ads FOR SELECT
  TO public
  USING (active = true);

-- Admin users can manage all ads
CREATE POLICY "Admin users can manage ads"
  ON ads FOR ALL
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ads_page_placement_active 
  ON ads(page, placement, active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ads_updated_at
  BEFORE UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION update_ads_updated_at();