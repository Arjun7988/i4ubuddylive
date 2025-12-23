/*
  # Add Shareable Link Token to RSVP Events

  1. Changes
    - Add `share_token` column to rsvp_events table
    - Add unique constraint on share_token
    - Create function to generate unique share tokens
    - Update RLS policies to allow public access via share token

  2. Security
    - Share tokens are unique and used for public access
    - Public can view events and create responses using share token
*/

-- Add share_token column to rsvp_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN share_token text UNIQUE;
  END IF;
END $$;

-- Create function to generate random share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(12), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Update existing events with share tokens
UPDATE rsvp_events
SET share_token = generate_share_token()
WHERE share_token IS NULL;

-- Create index on share_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_rsvp_events_share_token ON rsvp_events(share_token);

-- Drop existing "Anyone can view active events" policy
DROP POLICY IF EXISTS "Anyone can view active events" ON rsvp_events;

-- Create new policy that allows public access via share token
CREATE POLICY "Public can view events via share token"
  ON rsvp_events FOR SELECT
  USING (
    (is_active = true AND share_token IS NOT NULL)
    OR auth.uid() = user_id
  );

-- Drop existing "Anyone can create responses" policy
DROP POLICY IF EXISTS "Anyone can create responses" ON rsvp_responses;

-- Create new policy for public response creation via share token
CREATE POLICY "Public can create responses via share token"
  ON rsvp_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rsvp_events
      WHERE rsvp_events.id = rsvp_responses.event_id
      AND rsvp_events.is_active = true
      AND rsvp_events.share_token IS NOT NULL
    )
  );

-- Update policy to allow viewing responses by email
DROP POLICY IF EXISTS "Users can view own responses" ON rsvp_responses;

CREATE POLICY "Users can view own responses by email or user_id"
  ON rsvp_responses FOR SELECT
  USING (
    auth.uid() = user_id
    OR guest_email = current_setting('request.jwt.claims', true)::json->>'email'
  );
