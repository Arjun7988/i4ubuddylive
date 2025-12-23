/*
  # Optimize RLS Policies Part 2 - Split Bills & RSVP (Corrected)

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in RLS policies
  
  2. Tables Updated
    - friends
    - split_expenses
    - split_expense_participants
    - split_settlements
    - rsvp_events
    - rsvp_responses
*/

-- Friends
DROP POLICY IF EXISTS "Users can manage own friends" ON friends;

CREATE POLICY "Users can manage own friends"
  ON friends TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Split expenses
DROP POLICY IF EXISTS "Users can manage own split expenses" ON split_expenses;

CREATE POLICY "Users can manage own split expenses"
  ON split_expenses TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Split expense participants
DROP POLICY IF EXISTS "Users can manage own expense participants" ON split_expense_participants;

CREATE POLICY "Users can manage own expense participants"
  ON split_expense_participants TO authenticated
  USING (user_id = (select auth.uid()));

-- Split settlements
DROP POLICY IF EXISTS "Users can manage own settlements" ON split_settlements;

CREATE POLICY "Users can manage own settlements"
  ON split_settlements TO authenticated
  USING (user_id = (select auth.uid()));

-- RSVP events
DROP POLICY IF EXISTS "Authenticated users can create events" ON rsvp_events;
DROP POLICY IF EXISTS "Users can view own events" ON rsvp_events;
DROP POLICY IF EXISTS "Users can update own events" ON rsvp_events;
DROP POLICY IF EXISTS "Users can delete own events" ON rsvp_events;

CREATE POLICY "Authenticated users can create events"
  ON rsvp_events FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view own events"
  ON rsvp_events FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own events"
  ON rsvp_events FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own events"
  ON rsvp_events FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- RSVP responses
DROP POLICY IF EXISTS "Event creators can view responses" ON rsvp_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON rsvp_responses;
DROP POLICY IF EXISTS "Users can delete own responses" ON rsvp_responses;
DROP POLICY IF EXISTS "Users can view own responses by email or user_id" ON rsvp_responses;

CREATE POLICY "Event creators can view responses"
  ON rsvp_responses FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT id FROM rsvp_events WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can view own responses by email or user_id"
  ON rsvp_responses FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    guest_email = (select auth.email())
  );

CREATE POLICY "Users can update own responses"
  ON rsvp_responses FOR UPDATE TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    guest_email = (select auth.email())
  );

CREATE POLICY "Users can delete own responses"
  ON rsvp_responses FOR DELETE TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    guest_email = (select auth.email())
  );