/*
  # Add location_address to events_events table

  1. Changes
    - Add `location_address` column to `events_events` table
      - Stores the full address from Google Places autocomplete
      - Makes it easier to display and search for event locations

  2. Notes
    - Column is nullable to support existing events
    - New events will use this field for primary location display
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events_events' AND column_name = 'location_address'
  ) THEN
    ALTER TABLE events_events ADD COLUMN location_address text;
  END IF;
END $$;
