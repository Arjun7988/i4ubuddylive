/*
  # Add User Status and Travel Categories

  1. Changes to Existing Tables
    - Add `is_active` column to profiles table
    - Add default value true for existing users

  2. New Tables
    - `travel_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `slug` (text, unique)
      - `description` (text)
      - `icon` (text)
      - `is_active` (boolean)
      - `display_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Changes to travel_posts
    - Add `category_id` foreign key to travel_categories
    - Add `is_active` column for post moderation

  4. Security
    - Enable RLS on travel_categories
    - Public can read active categories
    - Only admins can manage categories
*/

-- Add is_active column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Create travel_categories table
CREATE TABLE IF NOT EXISTS travel_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'MapPin',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on travel_categories
ALTER TABLE travel_categories ENABLE ROW LEVEL SECURITY;

-- Public can read active categories
CREATE POLICY "Public can read active travel categories"
  ON travel_categories
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can read all categories
CREATE POLICY "Authenticated users can read all travel categories"
  ON travel_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Add category_id to travel_posts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN category_id uuid REFERENCES travel_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add is_active to travel_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Insert default travel categories
INSERT INTO travel_categories (name, slug, description, icon, display_order) VALUES
  ('Adventure Travel', 'adventure', 'Hiking, trekking, camping and outdoor activities', 'Mountain', 1),
  ('Beach & Islands', 'beach', 'Coastal destinations and island getaways', 'Waves', 2),
  ('City Tours', 'city', 'Urban exploration and city sightseeing', 'Building2', 3),
  ('Road Trips', 'road-trip', 'Self-drive journeys and scenic routes', 'Car', 4),
  ('Backpacking', 'backpacking', 'Budget travel and hostel stays', 'Backpack', 5),
  ('Luxury Travel', 'luxury', 'Premium experiences and luxury resorts', 'Crown', 6),
  ('Solo Travel', 'solo', 'Independent travel experiences', 'User', 7),
  ('Group Travel', 'group', 'Travel with friends or groups', 'Users', 8),
  ('Photography', 'photography', 'Travel focused on photography', 'Camera', 9),
  ('Cultural Tours', 'cultural', 'Heritage sites and cultural experiences', 'Landmark', 10)
ON CONFLICT (slug) DO NOTHING;

-- Create index on category_id
CREATE INDEX IF NOT EXISTS idx_travel_posts_category ON travel_posts(category_id);

-- Create index on is_active for both tables
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_travel_posts_is_active ON travel_posts(is_active);
CREATE INDEX IF NOT EXISTS idx_travel_categories_is_active ON travel_categories(is_active);
