/*
  # Create RSVP Events and Responses Tables

  1. New Tables
    - `rsvp_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users) - event creator
      - `title` (text) - event name
      - `description` (text) - event details
      - `event_date` (timestamptz) - when the event happens
      - `location` (text) - where the event is
      - `max_attendees` (integer) - optional capacity limit
      - `is_active` (boolean) - whether accepting responses
      - `created_at` (timestamptz)
    
    - `rsvp_responses`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to rsvp_events)
      - `user_id` (uuid, foreign key to auth.users)
      - `guest_name` (text) - name of respondent
      - `guest_email` (text) - contact email
      - `response` (text) - 'yes', 'no', or 'maybe'
      - `guests_count` (integer) - number of people attending (including self)
      - `dietary_restrictions` (text) - optional dietary needs
      - `notes` (text) - optional additional notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can read all active events
    - Users can create events
    - Users can update/delete their own events
    - Anyone can create responses
    - Users can update their own responses
    - Event creators can view all responses to their events
*/

-- Create rsvp_events table
CREATE TABLE IF NOT EXISTS rsvp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  location text NOT NULL,
  max_attendees integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create rsvp_responses table
CREATE TABLE IF NOT EXISTS rsvp_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES rsvp_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  response text NOT NULL CHECK (response IN ('yes', 'no', 'maybe')),
  guests_count integer DEFAULT 1 CHECK (guests_count >= 1),
  dietary_restrictions text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rsvp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rsvp_events

-- Anyone can view active events
CREATE POLICY "Anyone can view active events"
  ON rsvp_events FOR SELECT
  USING (is_active = true);

-- Authenticated users can create events
CREATE POLICY "Authenticated users can create events"
  ON rsvp_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update own events"
  ON rsvp_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete own events"
  ON rsvp_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for rsvp_responses

-- Anyone can create responses (for public RSVP forms)
CREATE POLICY "Anyone can create responses"
  ON rsvp_responses FOR INSERT
  WITH CHECK (true);

-- Users can view their own responses
CREATE POLICY "Users can view own responses"
  ON rsvp_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Event creators can view all responses to their events
CREATE POLICY "Event creators can view responses"
  ON rsvp_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rsvp_events
      WHERE rsvp_events.id = rsvp_responses.event_id
      AND rsvp_events.user_id = auth.uid()
    )
  );

-- Users can update their own responses
CREATE POLICY "Users can update own responses"
  ON rsvp_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own responses
CREATE POLICY "Users can delete own responses"
  ON rsvp_responses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rsvp_events_user_id ON rsvp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_events_event_date ON rsvp_events(event_date);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_event_id ON rsvp_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_user_id ON rsvp_responses(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rsvp_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rsvp_responses_updated_at
  BEFORE UPDATE ON rsvp_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_rsvp_responses_updated_at();
