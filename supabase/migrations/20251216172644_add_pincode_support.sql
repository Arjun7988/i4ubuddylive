/*
  # Add Pincode Support for Location-Based Features

  1. Changes
    - Add `pincode`, `city`, and `state` columns to `profiles` table
    - Create `zipcodes` master table for location data
    - Update `handle_new_user` function to save location data from user metadata
    - Add index on pincode for faster location-based queries

  2. Security
    - Existing RLS policies on profiles remain unchanged
    - Zipcodes table has public read access for location lookups

  3. Notes
    - All new columns are nullable to support existing users
    - Pincode data enables showing nearby content first across the app
*/

-- Add location columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_pincode ON public.profiles(pincode);

-- Create zipcodes master table
CREATE TABLE IF NOT EXISTS public.zipcodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode text UNIQUE NOT NULL,
  city text,
  state text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add index for fast zipcode lookups
CREATE INDEX IF NOT EXISTS idx_zipcodes_pincode ON public.zipcodes(pincode);

-- Enable RLS on zipcodes
ALTER TABLE public.zipcodes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to zipcodes for location lookups
CREATE POLICY "Anyone can read zipcodes"
  ON public.zipcodes FOR SELECT
  TO authenticated
  USING (true);

-- Update handle_new_user function to save location data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, pincode, city, state)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'pincode', NULL),
    COALESCE(new.raw_user_meta_data->>'city', NULL),
    COALESCE(new.raw_user_meta_data->>'state', NULL)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
