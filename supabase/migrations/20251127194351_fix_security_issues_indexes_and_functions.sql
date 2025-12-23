/*
  # Fix Security Issues - Indexes and Functions

  ## Changes

  1. Foreign Key Indexes
    - Add indexes for all unindexed foreign keys to improve query performance:
      - accounts.user_id
      - admin_sessions.admin_user_id
      - budgets.category_id, user_id
      - categories.user_id
      - chat_messages.user_id
      - classifieds.category_id
      - recurring_rules.account_id, category_id, user_id
      - rsvp_events.user_id
      - split_expense_participants.friend_id
      - split_expenses.payer_friend_id
      - split_settlements.from_friend_id, to_friend_id
      - transactions.account_id, category_id
      - travel_posts.category_id, user_id

  2. Unused Indexes
    - Remove unused indexes:
      - idx_chat_messages_reply_to
      - idx_rsvp_events_location

  3. Function Search Path
    - Fix mutable search_path for functions:
      - get_user_daily_message_count
      - check_user_30day_posting_limit
      - seed_default_categories
*/

-- =====================================================
-- PART 1: Add Missing Foreign Key Indexes
-- =====================================================

-- accounts table
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- admin_sessions table
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);

-- budgets table
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- categories table
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- chat_messages table
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- classifieds table
CREATE INDEX IF NOT EXISTS idx_classifieds_category_id ON classifieds(category_id);

-- recurring_rules table
CREATE INDEX IF NOT EXISTS idx_recurring_rules_account_id ON recurring_rules(account_id);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_category_id ON recurring_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_user_id ON recurring_rules(user_id);

-- rsvp_events table
CREATE INDEX IF NOT EXISTS idx_rsvp_events_user_id ON rsvp_events(user_id);

-- split_expense_participants table
CREATE INDEX IF NOT EXISTS idx_split_expense_participants_friend_id ON split_expense_participants(friend_id);

-- split_expenses table
CREATE INDEX IF NOT EXISTS idx_split_expenses_payer_friend_id ON split_expenses(payer_friend_id);

-- split_settlements table
CREATE INDEX IF NOT EXISTS idx_split_settlements_from_friend_id ON split_settlements(from_friend_id);
CREATE INDEX IF NOT EXISTS idx_split_settlements_to_friend_id ON split_settlements(to_friend_id);

-- transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

-- travel_posts table
CREATE INDEX IF NOT EXISTS idx_travel_posts_category_id ON travel_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_travel_posts_user_id ON travel_posts(user_id);

-- =====================================================
-- PART 2: Remove Unused Indexes
-- =====================================================

DROP INDEX IF EXISTS idx_chat_messages_reply_to;
DROP INDEX IF EXISTS idx_rsvp_events_location;

-- =====================================================
-- PART 3: Fix Function Search Paths
-- =====================================================

-- Drop and recreate get_user_daily_message_count with immutable search path
DROP FUNCTION IF EXISTS get_user_daily_message_count(uuid);

CREATE FUNCTION get_user_daily_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  message_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO message_count
  FROM chat_messages
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';

  RETURN COALESCE(message_count, 0);
END;
$$;

-- Drop and recreate check_user_30day_posting_limit with immutable search path
DROP FUNCTION IF EXISTS check_user_30day_posting_limit(uuid);

CREATE FUNCTION check_user_30day_posting_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  post_count integer;
  max_posts integer := 2;
BEGIN
  SELECT COUNT(*)::integer INTO post_count
  FROM classifieds
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '30 days'
    AND status = 'active';

  RETURN post_count < max_posts;
END;
$$;

-- Drop and recreate seed_default_categories with immutable search path
DROP FUNCTION IF EXISTS seed_default_categories(uuid);

CREATE FUNCTION seed_default_categories(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO categories (name, type, color, user_id)
  VALUES
    ('Salary', 'income', '#10b981', user_uuid),
    ('Freelance', 'income', '#34d399', user_uuid),
    ('Groceries', 'expense', '#ef4444', user_uuid),
    ('Transport', 'expense', '#f59e0b', user_uuid),
    ('Entertainment', 'expense', '#8b5cf6', user_uuid),
    ('Utilities', 'expense', '#3b82f6', user_uuid)
  ON CONFLICT DO NOTHING;
END;
$$;

-- =====================================================
-- Performance and Security Improvements Complete
-- =====================================================
