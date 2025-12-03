/*
  # Split Bills Feature (Splitwise-style)

  1. New Tables
    - `friends`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `created_at` (timestamptz)
    - `split_expenses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `description` (text)
      - `date` (date)
      - `total_amount` (decimal)
      - `payer_type` (text: 'me' or 'friend')
      - `payer_friend_id` (uuid, nullable, references friends)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
    - `split_expense_participants`
      - `id` (uuid, primary key)
      - `expense_id` (uuid, references split_expenses)
      - `user_id` (uuid, references auth.users)
      - `participant_type` (text: 'me' or 'friend')
      - `friend_id` (uuid, nullable, references friends)
      - `share_amount` (decimal)
    - `split_settlements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `from_type` (text: 'me' or 'friend')
      - `from_friend_id` (uuid, nullable, references friends)
      - `to_type` (text: 'me' or 'friend')
      - `to_friend_id` (uuid, nullable, references friends)
      - `amount` (decimal)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add owner-only policies for all operations
*/

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id, name);

-- Split expenses table
CREATE TABLE IF NOT EXISTS split_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  date date NOT NULL DEFAULT current_date,
  total_amount decimal(12,2) NOT NULL CHECK (total_amount >= 0),
  payer_type text NOT NULL CHECK (payer_type IN ('me','friend')),
  payer_friend_id uuid NULL REFERENCES friends(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_split_expenses_user_date ON split_expenses(user_id, date);

-- Participants table
CREATE TABLE IF NOT EXISTS split_expense_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES split_expenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_type text NOT NULL CHECK (participant_type IN ('me','friend')),
  friend_id uuid NULL REFERENCES friends(id) ON DELETE SET NULL,
  share_amount decimal(12,2) NOT NULL CHECK (share_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_participants_expense ON split_expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON split_expense_participants(user_id);

-- Settlements table
CREATE TABLE IF NOT EXISTS split_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT current_date,
  from_type text NOT NULL CHECK (from_type IN ('me','friend')),
  from_friend_id uuid NULL REFERENCES friends(id) ON DELETE SET NULL,
  to_type text NOT NULL CHECK (to_type IN ('me','friend')),
  to_friend_id uuid NULL REFERENCES friends(id) ON DELETE SET NULL,
  amount decimal(12,2) NOT NULL CHECK (amount > 0),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlements_user_date ON split_settlements(user_id, date);

-- Enable RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_settlements ENABLE ROW LEVEL SECURITY;

-- Policies: owner-only access
CREATE POLICY "Users can manage own friends"
  ON friends
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own split expenses"
  ON split_expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own expense participants"
  ON split_expense_participants
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own settlements"
  ON split_settlements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);