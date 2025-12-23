/*
  # Add Timezone and Coordinates to Events

  1. New Columns
    - `timezone` (text, nullable)
      Timezone for the event (e.g., 'America/New_York')
    - `latitude` (double precision, nullable)
      Latitude coordinate for venue location
    - `longitude` (double precision, nullable)
      Longitude coordinate for venue location

  2. Changes
    - All new columns are nullable
    - No existing columns are modified or dropped
    - Coordinates will be used for displaying Google Maps
    - Timezone will be used for proper time display
*/

-- Add timezone and coordinate columns to events_events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events_events' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE events_events ADD COLUMN timezone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events_events' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE events_events ADD COLUMN latitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events_events' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE events_events ADD COLUMN longitude double precision;
  END IF;
END $$;