/*
  # Fix Public Access for RSVP Events

  1. Changes
    - Drop and recreate RLS policy to allow anonymous access via share token
    - Allow anonymous users to view events using share token
    - Allow anonymous users to create responses

  2. Security
    - Only events with share_token can be accessed publicly
    - Only active events are accessible
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Public can view events via share token" ON rsvp_events;

-- Create new policy that allows anonymous (not authenticated) access via share token
CREATE POLICY "Public can view events via share token"
  ON rsvp_events FOR SELECT
  TO anon, authenticated
  USING (
    (is_active = true AND share_token IS NOT NULL)
  );

-- Also allow authenticated users to view their own events
CREATE POLICY "Users can view own events"
  ON rsvp_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop and recreate the insert policy for responses to allow anonymous
DROP POLICY IF EXISTS "Public can create responses via share token" ON rsvp_responses;

CREATE POLICY "Public can create responses via share token"
  ON rsvp_responses FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rsvp_events
      WHERE rsvp_events.id = rsvp_responses.event_id
      AND rsvp_events.is_active = true
      AND rsvp_events.share_token IS NOT NULL
    )
  );
