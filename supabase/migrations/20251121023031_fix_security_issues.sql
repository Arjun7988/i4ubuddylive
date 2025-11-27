/*
  # Fix Security and Performance Issues

  ## Changes Made

  1. **RLS Performance Optimization**
     - Replace `auth.uid()` with `(select auth.uid())` in all policies
     - This prevents re-evaluation for each row, improving query performance at scale

  2. **Remove Duplicate Policies**
     - Drop duplicate permissive policies on same tables
     - Keep only the most comprehensive policy for each action

  3. **Fix Function Search Paths**
     - Add `SECURITY DEFINER` and explicit search_path to all functions
     - Prevents search_path injection attacks

  ## Tables Affected
  - travel_posts, travel_post_reactions, travel_post_permissions
  - classifieds (uses created_by_id)
  - chat_messages
  - coupons (no user ownership)
  - profiles, rsvp_events, rsvp_responses, travel_categories
*/

-- =====================================================
-- PART 1: DROP DUPLICATE POLICIES
-- =====================================================

-- Drop duplicate chat_messages DELETE policies (keep most comprehensive)
DROP POLICY IF EXISTS "Admin can delete any chat message" ON chat_messages;
DROP POLICY IF EXISTS "Admins can delete any message" ON chat_messages;

-- Drop duplicate chat_messages UPDATE policies
DROP POLICY IF EXISTS "Admins can update any message" ON chat_messages;

-- Drop duplicate classifieds SELECT policies
DROP POLICY IF EXISTS "Admins can read all classifieds" ON classifieds;
DROP POLICY IF EXISTS "Admins can view all classifieds" ON classifieds;

-- Drop duplicate classifieds UPDATE policies
DROP POLICY IF EXISTS "Admins can update any classified" ON classifieds;

-- Drop duplicate coupons SELECT policies
DROP POLICY IF EXISTS "Admins can view all coupons" ON coupons;

-- Drop duplicate profiles SELECT policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Drop duplicate rsvp_events SELECT policies
DROP POLICY IF EXISTS "Users can view own events" ON rsvp_events;

-- Drop duplicate rsvp_responses SELECT policies
DROP POLICY IF EXISTS "Event creators can view responses" ON rsvp_responses;

-- Drop duplicate travel_categories SELECT policies
DROP POLICY IF EXISTS "Authenticated users can read all travel categories" ON travel_categories;

-- Drop duplicate travel_posts DELETE policies
DROP POLICY IF EXISTS "Allow admin delete access to travel posts" ON travel_posts;

-- Drop duplicate travel_posts UPDATE policies
DROP POLICY IF EXISTS "Allow admin update access to travel posts" ON travel_posts;

-- =====================================================
-- PART 2: RECREATE OPTIMIZED RLS POLICIES
-- =====================================================

-- TRAVEL POSTS
DROP POLICY IF EXISTS "Users can delete own posts or admins can delete any" ON travel_posts;
CREATE POLICY "Users can delete own posts or admins can delete any"
  ON travel_posts FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can update own travel posts" ON travel_posts;
CREATE POLICY "Users can update own travel posts"
  ON travel_posts FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users with permission can create travel posts" ON travel_posts;
CREATE POLICY "Users with permission can create travel posts"
  ON travel_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM travel_post_permissions
      WHERE user_id = (select auth.uid()) AND can_post = true
    )
  );

-- TRAVEL POST REACTIONS
DROP POLICY IF EXISTS "Users can add reactions" ON travel_post_reactions;
CREATE POLICY "Users can add reactions"
  ON travel_post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can remove own reactions" ON travel_post_reactions;
CREATE POLICY "Users can remove own reactions"
  ON travel_post_reactions FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- TRAVEL POST PERMISSIONS
DROP POLICY IF EXISTS "Users can view own permissions" ON travel_post_permissions;
CREATE POLICY "Users can view own permissions"
  ON travel_post_permissions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- CLASSIFIEDS (uses created_by_id)
DROP POLICY IF EXISTS "Authenticated users can read their own classifieds" ON classifieds;
CREATE POLICY "Authenticated users can read their own classifieds"
  ON classifieds FOR SELECT
  TO authenticated
  USING (
    created_by_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create classifieds" ON classifieds;
CREATE POLICY "Authenticated users can create classifieds"
  ON classifieds FOR INSERT
  TO authenticated
  WITH CHECK (created_by_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own classifieds" ON classifieds;
CREATE POLICY "Users can update their own classifieds"
  ON classifieds FOR UPDATE
  TO authenticated
  USING (
    created_by_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    created_by_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can delete their own classifieds" ON classifieds;
CREATE POLICY "Users can delete their own classifieds"
  ON classifieds FOR DELETE
  TO authenticated
  USING (created_by_id = (select auth.uid()));

-- CHAT MESSAGES
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
CREATE POLICY "Users can update their own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users and admins can insert messages" ON chat_messages;
CREATE POLICY "Users and admins can insert messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- COUPONS (admin-only table, no user ownership)
DROP POLICY IF EXISTS "Admins can insert coupons" ON coupons;
CREATE POLICY "Admins can insert coupons"
  ON coupons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update coupons" ON coupons;
CREATE POLICY "Admins can update coupons"
  ON coupons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete coupons" ON coupons;
CREATE POLICY "Admins can delete coupons"
  ON coupons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- =====================================================
-- PART 3: FIX FUNCTION SEARCH PATHS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

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

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  INSERT INTO categories (user_id, name, type, icon, color)
  VALUES
    (NEW.id, 'Groceries', 'expense', '🛒', '#10b981'),
    (NEW.id, 'Salary', 'income', '💰', '#3b82f6'),
    (NEW.id, 'Utilities', 'expense', '⚡', '#f59e0b'),
    (NEW.id, 'Transport', 'expense', '🚗', '#8b5cf6'),
    (NEW.id, 'Entertainment', 'expense', '🎬', '#ec4899');

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_rsvp_responses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION update_travel_post_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION increment_classified_views(classified_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE classifieds
  SET views_count = views_count + 1
  WHERE id = classified_id;
END;
$$;

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
