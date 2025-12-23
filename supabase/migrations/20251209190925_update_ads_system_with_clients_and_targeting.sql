/*
  # Update Ads System with Enhanced Features

  1. Changes to Tables
    - Drop existing `ads` table
    - Create `ad_clients` table for client management
    - Create enhanced `ads` table with:
      - Client relationship
      - Location targeting (state, city, pincode)
      - Date scheduling (start_date, end_date)
      - Enhanced popup support
      - Status management (ACTIVE/INACTIVE/EXPIRED)
      - Created by tracking

  2. Security
    - Enable RLS on both tables
    - Public can view active ads within their date range
    - Admin users can manage all ads and clients

  3. Indexes
    - Optimize queries by page, placement, status, and dates
*/

-- Drop existing ads table
DROP TABLE IF EXISTS ads CASCADE;

-- Create ad_clients table
CREATE TABLE IF NOT EXISTS ad_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create enhanced ads table
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Client relationship
  client_id uuid REFERENCES ad_clients(id) ON DELETE SET NULL,
  
  -- Basic ad info
  title text NOT NULL,
  image_url text,
  redirect_url text,
  
  -- Action type: redirect or popup
  action_type text DEFAULT 'redirect' CHECK (action_type IN ('redirect', 'popup')),
  
  -- Popup content
  popup_image_url text,
  popup_description text,
  
  -- Page and placement targeting
  page text NOT NULL,
  placement text NOT NULL,
  
  -- Location targeting
  target_state text,
  target_city text,
  target_pincode text,
  
  -- Scheduling
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  
  -- Status: ACTIVE, INACTIVE, EXPIRED
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED')),
  
  -- Admin tracking
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on ad_clients
ALTER TABLE ad_clients ENABLE ROW LEVEL SECURITY;

-- Public cannot view clients
CREATE POLICY "Only admins can view ad clients"
  ON ad_clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can manage clients
CREATE POLICY "Admins can manage ad clients"
  ON ad_clients FOR ALL
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

-- Enable RLS on ads
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Public can view active ads within their date range
CREATE POLICY "Public can view active ads"
  ON ads FOR SELECT
  TO public
  USING (
    status = 'ACTIVE' 
    AND (start_date IS NULL OR start_date <= CURRENT_DATE)
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  );

-- Admins can manage all ads
CREATE POLICY "Admins can manage ads"
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ads_page_placement 
  ON ads(page, placement);

CREATE INDEX IF NOT EXISTS idx_ads_status 
  ON ads(status);

CREATE INDEX IF NOT EXISTS idx_ads_dates 
  ON ads(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_ads_client 
  ON ads(client_id);

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