/*
  # Create Buddy Service Reviews System

  1. New Tables
    - `buddy_service_reviews`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, foreign key to buddy_service_listings)
      - `user_id` (uuid, foreign key to auth.users)
      - `rating` (smallint, 1-5)
      - `comment` (text)
      - `user_name` (text, cached from profiles)
      - `is_approved` (boolean, default false - requires admin approval)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `buddy_service_reviews` table
    - Policy for authenticated users to create reviews
    - Policy for everyone to read approved reviews
    - Policy for admins to manage all reviews
  
  3. Indexes
    - Index on `listing_id` for faster lookups
    - Index on `user_id` for user's reviews
    - Index on `is_approved` for filtering approved reviews
*/

-- Create buddy_service_reviews table
CREATE TABLE IF NOT EXISTS buddy_service_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES buddy_service_listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  user_name text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_buddy_service_reviews_listing_id ON buddy_service_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_buddy_service_reviews_user_id ON buddy_service_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_service_reviews_is_approved ON buddy_service_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_buddy_service_reviews_created_at ON buddy_service_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE buddy_service_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON buddy_service_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read approved reviews (public)
CREATE POLICY "Anyone can read approved reviews"
  ON buddy_service_reviews
  FOR SELECT
  TO public
  USING (is_approved = true);

-- Policy: Users can read their own reviews (even if not approved)
CREATE POLICY "Users can read their own reviews"
  ON buddy_service_reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own reviews (only if not yet approved)
CREATE POLICY "Users can update their own pending reviews"
  ON buddy_service_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_approved = false)
  WITH CHECK (auth.uid() = user_id AND is_approved = false);

-- Policy: Users can delete their own reviews (only if not yet approved)
CREATE POLICY "Users can delete their own pending reviews"
  ON buddy_service_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_approved = false);

-- Admin policies
CREATE POLICY "Admins can read all reviews"
  ON buddy_service_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update all reviews"
  ON buddy_service_reviews
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

CREATE POLICY "Admins can delete all reviews"
  ON buddy_service_reviews
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_buddy_service_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_buddy_service_reviews_updated_at_trigger
  BEFORE UPDATE ON buddy_service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_buddy_service_reviews_updated_at();