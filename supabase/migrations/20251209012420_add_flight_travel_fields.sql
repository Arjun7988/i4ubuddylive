/*
  # Add Flight Travel Specific Fields

  1. New Columns
    - `role` (text, optional) - Participation role: "Offering Help" or "Seeking Help"
    - `flight_code` (text, optional) - Flight number/code
    - `origin_airport` (text, optional) - IATA code for origin airport
    - `destination_airport` (text, optional) - IATA code for destination airport
    - `depart_at` (timestamptz, optional) - Departure datetime
    - `arrive_at` (timestamptz, optional) - Arrival datetime
    - `languages` (text, optional) - Languages spoken
    - `contact_method` (text, optional) - Preferred contact method
    - `contact_value` (text, optional) - Contact information value
  
  2. Notes
    - These fields are only populated for "Flight Travel" category posts
    - All fields are nullable to maintain backward compatibility
    - Existing posts will have NULL values for these fields
*/

-- Add role column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'role'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN role text;
  END IF;
END $$;

-- Add flight_code column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'flight_code'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN flight_code text;
  END IF;
END $$;

-- Add origin_airport column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'origin_airport'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN origin_airport text;
  END IF;
END $$;

-- Add destination_airport column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'destination_airport'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN destination_airport text;
  END IF;
END $$;

-- Add depart_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'depart_at'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN depart_at timestamptz;
  END IF;
END $$;

-- Add arrive_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'arrive_at'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN arrive_at timestamptz;
  END IF;
END $$;

-- Add languages column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'languages'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN languages text;
  END IF;
END $$;

-- Add contact_method column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'contact_method'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN contact_method text;
  END IF;
END $$;

-- Add contact_value column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'travel_posts' AND column_name = 'contact_value'
  ) THEN
    ALTER TABLE travel_posts ADD COLUMN contact_value text;
  END IF;
END $$;

-- Create indexes for flight-specific searches
CREATE INDEX IF NOT EXISTS idx_travel_posts_flight_code ON travel_posts(flight_code);
CREATE INDEX IF NOT EXISTS idx_travel_posts_origin_airport ON travel_posts(origin_airport);
CREATE INDEX IF NOT EXISTS idx_travel_posts_destination_airport ON travel_posts(destination_airport);
CREATE INDEX IF NOT EXISTS idx_travel_posts_depart_at ON travel_posts(depart_at);
