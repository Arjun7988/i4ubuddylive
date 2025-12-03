/*
  # Fix Remaining Security Issues

  ## Changes Made

  1. **Drop Unused Indexes**
     - Remove 29 unused indexes to reduce storage overhead and maintenance cost
     - These indexes have not been used and are not providing any performance benefit

  2. **Consolidate Duplicate Policies**
     - Merge duplicate SELECT policies on classifieds table
     - Keep one comprehensive policy that covers all use cases

  3. **Fix Remaining Function Search Paths**
     - Already fixed in previous migration but ensuring they're properly set
     - Prevents search_path injection vulnerabilities

  ## Security Impact
  - Reduces database bloat from unused indexes
  - Simplifies RLS policy evaluation
  - Eliminates search_path injection risks
*/

-- =====================================================
-- PART 1: DROP UNUSED INDEXES
-- =====================================================

-- RSVP Events indexes
DROP INDEX IF EXISTS idx_rsvp_events_user_id;
DROP INDEX IF EXISTS idx_rsvp_events_event_date;
DROP INDEX IF EXISTS idx_rsvp_events_share_token;

-- Accounts indexes
DROP INDEX IF EXISTS idx_accounts_user_id;

-- Transactions indexes
DROP INDEX IF EXISTS transactions_account_idx;
DROP INDEX IF EXISTS transactions_category_idx;

-- Admin sessions indexes
DROP INDEX IF EXISTS idx_admin_sessions_admin_user_id;

-- Budgets indexes
DROP INDEX IF EXISTS idx_budgets_category_id;
DROP INDEX IF EXISTS idx_budgets_user_id;

-- Categories indexes
DROP INDEX IF EXISTS idx_categories_user_id;

-- Split expenses indexes
DROP INDEX IF EXISTS idx_split_expenses_payer_friend_id;
DROP INDEX IF EXISTS idx_split_expenses_share_token;

-- Recurring rules indexes
DROP INDEX IF EXISTS idx_recurring_rules_account_id;
DROP INDEX IF EXISTS idx_recurring_rules_category_id;
DROP INDEX IF EXISTS idx_recurring_rules_user_id;

-- Split settlements indexes
DROP INDEX IF EXISTS idx_split_settlements_from_friend_id;
DROP INDEX IF EXISTS idx_split_settlements_to_friend_id;

-- Split expense participants indexes
DROP INDEX IF EXISTS idx_split_expense_participants_friend_id;

-- Classifieds indexes
DROP INDEX IF EXISTS idx_classifieds_category;
DROP INDEX IF EXISTS idx_classifieds_price;
DROP INDEX IF EXISTS idx_classifieds_is_featured;

-- Travel posts indexes
DROP INDEX IF EXISTS idx_travel_posts_user_id;
DROP INDEX IF EXISTS idx_travel_posts_category;
DROP INDEX IF EXISTS idx_travel_posts_is_active;
DROP INDEX IF EXISTS idx_travel_posts_share_token;

-- Profiles indexes
DROP INDEX IF EXISTS idx_profiles_is_active;

-- Travel categories indexes
DROP INDEX IF EXISTS idx_travel_categories_is_active;

-- Chat messages indexes
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_chat_messages_is_pinned;

-- =====================================================
-- PART 2: CONSOLIDATE DUPLICATE POLICIES
-- =====================================================

-- Drop the duplicate classifieds SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read their own classifieds" ON classifieds;

-- Recreate a single comprehensive SELECT policy for classifieds
DROP POLICY IF EXISTS "Public can read active classifieds" ON classifieds;
CREATE POLICY "Users can read classifieds"
  ON classifieds FOR SELECT
  TO authenticated
  USING (
    status = 'active' OR
    created_by_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- Also allow anonymous users to read active classifieds
CREATE POLICY "Public can read active classifieds"
  ON classifieds FOR SELECT
  TO anon
  USING (status = 'active');

-- =====================================================
-- PART 3: VERIFY FUNCTION SEARCH PATHS ARE SET
-- =====================================================

-- These were already fixed in the previous migration
-- Just ensuring they are properly configured

-- Verify check_user_30day_posting_limit has proper search_path
CREATE OR REPLACE FUNCTION check_user_30day_posting_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO post_count
  FROM classifieds
  WHERE created_by_id = NEW.created_by_id
    AND created_at >= NOW() - INTERVAL '30 days';

  IF post_count >= 5 THEN
    RAISE EXCEPTION 'You have reached the limit of 5 classifieds per 30-day period';
  END IF;

  RETURN NEW;
END;
$$;

-- Verify seed_default_categories has proper search_path
CREATE OR REPLACE FUNCTION seed_default_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  FOR v_user_id IN SELECT id FROM auth.users LOOP
    INSERT INTO categories (user_id, name, type, icon, color)
    VALUES
      (v_user_id, 'Groceries', 'expense', '🛒', '#10b981'),
      (v_user_id, 'Salary', 'income', '💰', '#3b82f6'),
      (v_user_id, 'Utilities', 'expense', '⚡', '#f59e0b'),
      (v_user_id, 'Transport', 'expense', '🚗', '#8b5cf6'),
      (v_user_id, 'Entertainment', 'expense', '🎬', '#ec4899')
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;
