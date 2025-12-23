/*
  # Create Buddy Service Listings System

  1. New Tables
    - `buddy_service_requests`
      - Stores pending business listing submissions for admin review
      - Includes all business details, contact info, and review status
      - Links to category and subcategory
    
    - `buddy_service_listings`
      - Stores approved business listings that display on frontend
      - Contains all business information and operating details
      - Links to category, subcategory, and user
  
  2. Security
    - Enable RLS on both tables
    - Authenticated users can submit their own requests
    - Only admins can approve/reject requests
    - Only admins can manage listings
    - Public users can view approved listings
  
  3. Key Features
    - Business information (name, tagline, address, contact)
    - Operating hours
    - Social media links
    - Images support via URLs
    - Listing type (free/paid)
    - Request approval workflow (pending/approved/rejected/hold)
*/

-- Create buddy service requests table for submissions
CREATE TABLE IF NOT EXISTS buddy_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES buddy_service_categories(id) ON DELETE CASCADE NOT NULL,
  subcategory_id uuid REFERENCES buddy_service_subcategories(id) ON DELETE CASCADE,
  
  -- Business Information
  business_name text NOT NULL,
  tagline text,
  about_business text NOT NULL,
  
  -- Address
  street_address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  display_city text NOT NULL DEFAULT 'Dallas',
  
  -- Contact Information
  phone text NOT NULL,
  email text NOT NULL,
  website text,
  whatsapp text,
  social_link text,
  
  -- Business Details
  business_hours jsonb DEFAULT '{}',
  listing_type text NOT NULL CHECK (listing_type IN ('Free Listing', 'Paid Listing')),
  images jsonb DEFAULT '[]',
  
  -- Request Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hold')),
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create buddy service listings table for approved businesses
CREATE TABLE IF NOT EXISTS buddy_service_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_id uuid REFERENCES buddy_service_requests(id) ON DELETE SET NULL,
  category_id uuid REFERENCES buddy_service_categories(id) ON DELETE CASCADE NOT NULL,
  subcategory_id uuid REFERENCES buddy_service_subcategories(id) ON DELETE CASCADE,
  
  -- Business Information
  business_name text NOT NULL,
  tagline text,
  about_business text NOT NULL,
  slug text UNIQUE NOT NULL,
  
  -- Address
  street_address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  display_city text NOT NULL DEFAULT 'Dallas',
  
  -- Contact Information
  phone text NOT NULL,
  email text NOT NULL,
  website text,
  whatsapp text,
  social_link text,
  
  -- Business Details
  business_hours jsonb DEFAULT '{}',
  listing_type text NOT NULL CHECK (listing_type IN ('Free Listing', 'Paid Listing')),
  images jsonb DEFAULT '[]',
  
  -- Status
  is_active boolean DEFAULT true NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  
  -- Stats
  views_count integer DEFAULT 0 NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_buddy_service_requests_user_id ON buddy_service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_service_requests_category_id ON buddy_service_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_buddy_service_requests_subcategory_id ON buddy_service_requests(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_buddy_service_requests_status ON buddy_service_requests(status);
CREATE INDEX IF NOT EXISTS idx_buddy_service_requests_created_at ON buddy_service_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_buddy_service_listings_user_id ON buddy_service_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_service_listings_category_id ON buddy_service_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_buddy_service_listings_subcategory_id ON buddy_service_listings(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_buddy_service_listings_slug ON buddy_service_listings(slug);
CREATE INDEX IF NOT EXISTS idx_buddy_service_listings_is_active ON buddy_service_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_buddy_service_listings_display_city ON buddy_service_listings(display_city);

-- Enable RLS
ALTER TABLE buddy_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_service_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for buddy_service_requests

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON buddy_service_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own requests"
  ON buddy_service_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests
CREATE POLICY "Users can update own pending requests"
  ON buddy_service_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
  ON buddy_service_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update all requests
CREATE POLICY "Admins can update all requests"
  ON buddy_service_requests FOR UPDATE
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

-- Admins can delete requests
CREATE POLICY "Admins can delete requests"
  ON buddy_service_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies for buddy_service_listings

-- Public can view active listings
CREATE POLICY "Public can view active listings"
  ON buddy_service_listings FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admins can view all listings
CREATE POLICY "Admins can view all listings"
  ON buddy_service_listings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can create listings
CREATE POLICY "Admins can create listings"
  ON buddy_service_listings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update listings
CREATE POLICY "Admins can update listings"
  ON buddy_service_listings FOR UPDATE
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

-- Admins can delete listings
CREATE POLICY "Admins can delete listings"
  ON buddy_service_listings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Function to generate slug from business name
CREATE OR REPLACE FUNCTION generate_business_slug(business_name text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Create base slug: lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(business_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure slug is unique
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM buddy_service_listings WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to increment listing views
CREATE OR REPLACE FUNCTION increment_listing_views(listing_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE buddy_service_listings
  SET views_count = views_count + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_buddy_service_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_buddy_service_requests_updated_at
  BEFORE UPDATE ON buddy_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_buddy_service_updated_at();

CREATE TRIGGER update_buddy_service_listings_updated_at
  BEFORE UPDATE ON buddy_service_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_buddy_service_updated_at();
