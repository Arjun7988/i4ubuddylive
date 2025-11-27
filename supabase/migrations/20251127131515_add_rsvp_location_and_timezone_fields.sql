/*
  # Add Location and Timezone Fields to RSVP Events

  1. Changes to `rsvp_events` table
    - Add `timezone` column to store event timezone (e.g., "America/Chicago")
    - Add `location_address` column for formatted address from Google Places
    - Add `location_lat` column for latitude coordinates
    - Add `location_lng` column for longitude coordinates
    - Add `location_place_id` column for Google Places ID
    - Keep existing `location` column for backward compatibility

  2. Notes
    - Existing events will have NULL for new fields
    - Timezone defaults to NULL (will be set by user)
    - Location coordinates enable Google Maps integration
*/

-- Add timezone column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN timezone text;
  END IF;
END $$;

-- Add location_address column for full formatted address
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'location_address'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN location_address text;
  END IF;
END $$;

-- Add location_lat column for latitude
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'location_lat'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN location_lat double precision;
  END IF;
END $$;

-- Add location_lng column for longitude
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'location_lng'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN location_lng double precision;
  END IF;
END $$;

-- Add location_place_id column for Google Places ID
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'location_place_id'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN location_place_id text;
  END IF;
END $$;

-- Create index on location coordinates for spatial queries (optional, for future features)
CREATE INDEX IF NOT EXISTS idx_rsvp_events_location ON rsvp_events(location_lat, location_lng);
