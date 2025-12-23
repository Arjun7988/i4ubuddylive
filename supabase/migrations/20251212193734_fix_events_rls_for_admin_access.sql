/*
  # Fix Events RLS Policies for Admin Access

  1. Changes
    - Drop existing SELECT policy for events_events
    - Create new SELECT policy that allows:
      - Public access to approved events
      - Users can see their own events
      - Admin users (is_admin = true) can see ALL events (any status)
    - This fixes the issue where admin couldn't see events in admin panel

  2. Security
    - Maintains RLS protection
    - Admin users identified by profiles.is_admin = true
    - Regular users can only see approved events or their own events
*/

DROP POLICY IF EXISTS "Public can view approved events" ON events_events;
DROP POLICY IF EXISTS "Allow select for approved events, own events, and all for admin" ON events_events;

CREATE POLICY "Allow select for approved events, own events, and all for admin"
  ON events_events
  FOR SELECT
  USING (
    status = 'approved'
    OR
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
