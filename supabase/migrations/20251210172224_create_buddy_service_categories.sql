/*
  # Create Buddy Service Categories

  1. New Tables
    - `buddy_service_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category display name
      - `slug` (text, unique) - URL-friendly identifier
      - `subtitle` (text, nullable) - Short description
      - `icon_emoji` (text, nullable) - Emoji icon for the category
      - `badge` (text, nullable) - Badge label (HOT, NEW, null)
      - `gradient_from` (text, nullable) - Start color for gradient
      - `gradient_to` (text, nullable) - End color for gradient
      - `is_active` (boolean) - Whether category is active
      - `sort_order` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `buddy_service_categories` table
    - Public can view active categories
    - Admin users can manage all categories
    
  3. Indexes
    - Optimize queries by slug, is_active, and sort_order
*/

-- Create buddy_service_categories table
CREATE TABLE IF NOT EXISTS buddy_service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  subtitle text,
  icon_emoji text,
  badge text CHECK (badge IN ('HOT', 'NEW')),
  gradient_from text,
  gradient_to text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE buddy_service_categories ENABLE ROW LEVEL SECURITY;

-- Public can view active categories
CREATE POLICY "Public can view active buddy service categories"
  ON buddy_service_categories FOR SELECT
  TO public
  USING (is_active = true);

-- Admins can view all categories
CREATE POLICY "Admins can view all buddy service categories"
  ON buddy_service_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can insert categories
CREATE POLICY "Admins can insert buddy service categories"
  ON buddy_service_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update categories
CREATE POLICY "Admins can update buddy service categories"
  ON buddy_service_categories FOR UPDATE
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

-- Admins can delete categories
CREATE POLICY "Admins can delete buddy service categories"
  ON buddy_service_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_buddy_service_categories_slug 
  ON buddy_service_categories(slug);

CREATE INDEX IF NOT EXISTS idx_buddy_service_categories_active 
  ON buddy_service_categories(is_active);

CREATE INDEX IF NOT EXISTS idx_buddy_service_categories_sort 
  ON buddy_service_categories(sort_order);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_buddy_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER buddy_service_categories_updated_at
  BEFORE UPDATE ON buddy_service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_buddy_service_categories_updated_at();

-- Insert some default categories
INSERT INTO buddy_service_categories (name, slug, subtitle, icon_emoji, badge, gradient_from, gradient_to, sort_order) VALUES
  ('Home Services', 'home-services', 'Find trusted professionals for your home', '🏠', 'HOT', '#3b82f6', '#8b5cf6', 1),
  ('Auto Services', 'auto-services', 'Car repairs, maintenance & more', '🚗', NULL, '#ef4444', '#f59e0b', 2),
  ('Health & Wellness', 'health-wellness', 'Healthcare and fitness professionals', '💪', 'NEW', '#10b981', '#14b8a6', 3),
  ('Education & Tutoring', 'education-tutoring', 'Expert tutors and instructors', '📚', NULL, '#6366f1', '#8b5cf6', 4),
  ('Events & Entertainment', 'events-entertainment', 'Make your event unforgettable', '🎉', NULL, '#ec4899', '#f43f5e', 5),
  ('Business Services', 'business-services', 'Professional business support', '💼', NULL, '#0ea5e9', '#06b6d4', 6)
ON CONFLICT (slug) DO NOTHING;