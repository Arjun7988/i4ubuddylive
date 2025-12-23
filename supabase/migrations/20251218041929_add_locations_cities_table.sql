/*
  # Create Locations Cities Table for Autocomplete

  1. New Tables
    - `locations_cities`
      - `id` (uuid, primary key)
      - `city` (text, city name)
      - `state` (text, state abbreviation)
      - `country` (text, country name, default 'USA')
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)

  2. Sample Data
    - Seed with Dallas/TX, Irving/TX, Frisco/TX, Plano/TX, Arlington/TX

  3. Security
    - Enable RLS on `locations_cities` table
    - Add policy for public read access (for autocomplete)
    - Add policy for admin write access
*/

CREATE TABLE IF NOT EXISTS locations_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'USA',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locations_cities_city ON locations_cities(city);
CREATE INDEX IF NOT EXISTS idx_locations_cities_state ON locations_cities(state);

ALTER TABLE locations_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active cities"
  ON locations_cities
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admins to manage cities"
  ON locations_cities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

INSERT INTO locations_cities (city, state, country) VALUES
  ('Dallas', 'TX', 'USA'),
  ('Irving', 'TX', 'USA'),
  ('Frisco', 'TX', 'USA'),
  ('Plano', 'TX', 'USA'),
  ('Arlington', 'TX', 'USA'),
  ('Fort Worth', 'TX', 'USA'),
  ('McKinney', 'TX', 'USA'),
  ('Denton', 'TX', 'USA'),
  ('Richardson', 'TX', 'USA'),
  ('Garland', 'TX', 'USA'),
  ('Carrollton', 'TX', 'USA'),
  ('Allen', 'TX', 'USA'),
  ('Grand Prairie', 'TX', 'USA'),
  ('Lewisville', 'TX', 'USA'),
  ('Mesquite', 'TX', 'USA')
ON CONFLICT DO NOTHING;