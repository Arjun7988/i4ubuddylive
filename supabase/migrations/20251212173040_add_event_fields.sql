/*
  # Add Event Fields

  1. New Columns
    - `attendance_mode` (text, default 'location_only')
      Values: 'location_only' | 'online_only' | 'location_and_online'
    - `fax` (text, nullable)
      Contact fax number
    - `eknazar_city` (text, nullable)
      City dropdown selection for EkNazar
    - `youtube_url` (text, nullable)
      YouTube video link for event
    - `has_seat_selection` (boolean, default false)
      Whether event has seat selection for tickets

  2. Changes
    - All new columns are nullable or have defaults
    - No existing columns are modified or dropped
*/

-- Add new columns to events_events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events_events' AND column_name = 'attendance_mode'
  ) THEN
    ALTER TABLE events_events ADD COLUMN attendance_mode text DEFAULT 'location_only' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events_events' AND column_name = 'fax'
  ) THEN
    ALTER TABLE events_events ADD COLUMN fax text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events_events' AND column_name = 'eknazar_city'
  ) THEN
    ALTER TABLE events_events ADD COLUMN eknazar_city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events_events' AND column_name = 'youtube_url'
  ) THEN
    ALTER TABLE events_events ADD COLUMN youtube_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events_events' AND column_name = 'has_seat_selection'
  ) THEN
    ALTER TABLE events_events ADD COLUMN has_seat_selection boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add check constraint for attendance_mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'events_events_attendance_mode_check'
  ) THEN
    ALTER TABLE events_events
    ADD CONSTRAINT events_events_attendance_mode_check
    CHECK (attendance_mode IN ('location_only', 'online_only', 'location_and_online'));
  END IF;
END $$;