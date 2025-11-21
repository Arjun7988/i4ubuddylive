-- =====================================================
-- Personal Finance Manager - Database Setup
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to set up the database
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- TABLE: categories
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  color text DEFAULT '#6A5AE0',
  icon text DEFAULT 'tag',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: accounts
-- =====================================================
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'investment', 'cash')),
  balance decimal(15, 2) DEFAULT 0,
  currency text DEFAULT 'USD',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  amount decimal(15, 2) NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  description text DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS transactions_account_idx ON transactions(account_id);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON transactions(category_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: budgets
-- =====================================================
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  amount decimal(15, 2) NOT NULL,
  period text DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: recurring_rules
-- =====================================================
CREATE TABLE IF NOT EXISTS recurring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  amount decimal(15, 2) NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  description text DEFAULT '',
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring rules"
  ON recurring_rules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring rules"
  ON recurring_rules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring rules"
  ON recurring_rules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring rules"
  ON recurring_rules FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTION: Auto-create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNCTION: Seed default categories for new users
-- =====================================================
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO categories (user_id, name, type, color, icon, is_default)
  VALUES
    (p_user_id, 'Salary', 'income', '#22C55E', 'dollar-sign', true),
    (p_user_id, 'Freelance', 'income', '#10B981', 'briefcase', true),
    (p_user_id, 'Investments', 'income', '#06B6D4', 'trending-up', true),
    (p_user_id, 'Other Income', 'income', '#14B8A6', 'plus-circle', true),
    (p_user_id, 'Groceries', 'expense', '#F59E0B', 'shopping-cart', true),
    (p_user_id, 'Dining Out', 'expense', '#EF4444', 'utensils', true),
    (p_user_id, 'Transportation', 'expense', '#8B5CF6', 'car', true),
    (p_user_id, 'Housing', 'expense', '#6366F1', 'home', true),
    (p_user_id, 'Utilities', 'expense', '#EC4899', 'zap', true),
    (p_user_id, 'Entertainment', 'expense', '#F97316', 'tv', true),
    (p_user_id, 'Healthcare', 'expense', '#14B8A6', 'heart', true),
    (p_user_id, 'Shopping', 'expense', '#A855F7', 'shopping-bag', true),
    (p_user_id, 'Other Expenses', 'expense', '#64748B', 'more-horizontal', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
