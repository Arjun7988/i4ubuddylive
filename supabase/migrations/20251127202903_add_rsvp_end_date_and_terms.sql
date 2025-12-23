/*
  # Add Event End Date and Terms Acceptance to RSVP Events

  ## Changes

  1. New Columns
    - Add `event_end_date` column for event end date and time
    - Add `event_end_time` column for event end time
    - Add `terms_accepted` column to track terms and conditions acceptance
    - Add `terms_accepted_at` column to track when terms were accepted

  2. Notes
    - event_end_date is optional (can be null for events without end time)
    - terms_accepted defaults to false
    - All changes are backward compatible
*/

-- Add event_end_date column for end date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'event_end_date'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN event_end_date date;
  END IF;
END $$;

-- Add event_end_time column for end time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'event_end_time'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN event_end_time time;
  END IF;
END $$;

-- Add terms_accepted column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'terms_accepted'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN terms_accepted boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add terms_accepted_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'terms_accepted_at'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN terms_accepted_at timestamptz;
  END IF;
END $$;
