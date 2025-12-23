/*
  # Create Events Module

  1. New Tables
    - `events_events`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz, default now)
      - `created_by` (uuid, references auth.users)
      - `title` (text, required)
      - `description` (text, required)
      - `start_at` (timestamptz, required)
      - `end_at` (timestamptz, nullable)
      - `venue` (text)
      - `street` (text)
      - `city` (text)
      - `state` (text)
      - `zip` (text)
      - `pincode` (text)
      - `is_online` (boolean, default false)
      - `online_link` (text)
      - `organizer` (text)
      - `phone` (text)
      - `email` (text)
      - `website_url` (text)
      - `poster_url` (text)
      - `registration_url` (text)
      - `ticketing_url` (text)
      - `status` (text, default 'pending')
      - `is_featured` (boolean, default false)
      - `featured_rank` (integer)

  2. Security
    - Enable RLS on `events_events` table
    - Public users can read approved events
    - Authenticated users can create events (own records)
    - Users can update/delete their own events
    - Admin users have full access

  3. Indexes
    - Index on start_at for date queries
    - Index on city + state for location queries
    - Index on status for filtering
    - Index on is_featured + featured_rank for featured events
*/

-- Create events_events table
CREATE TABLE IF NOT EXISTS events_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  venue text,
  street text,
  city text,
  state text,
  zip text,
  pincode text,
  is_online boolean DEFAULT false NOT NULL,
  online_link text,
  organizer text,
  phone text,
  email text,
  website_url text,
  poster_url text,
  registration_url text,
  ticketing_url text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured boolean DEFAULT false NOT NULL,
  featured_rank integer
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events_events(start_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_location ON events_events(city, state);
CREATE INDEX IF NOT EXISTS idx_events_status ON events_events(status);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events_events(is_featured, featured_rank) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events_events(created_by);

-- Enable RLS
ALTER TABLE events_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public users can view approved events
CREATE POLICY "Public users can view approved events"
  ON events_events FOR SELECT
  USING (status = 'approved');

-- Authenticated users can create events
CREATE POLICY "Authenticated users can create events"
  ON events_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can view their own events regardless of status
CREATE POLICY "Users can view own events"
  ON events_events FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- Users can update their own events
CREATE POLICY "Users can update own events"
  ON events_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own events
CREATE POLICY "Users can delete own events"
  ON events_events FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Admin users have full access
CREATE POLICY "Admin users can view all events"
  ON events_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admin users can update all events"
  ON events_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admin users can delete all events"
  ON events_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
