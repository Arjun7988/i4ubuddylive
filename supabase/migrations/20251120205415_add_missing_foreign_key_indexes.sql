/*
  # Add Missing Foreign Key Indexes

  1. Performance Optimization
    - Add indexes for all foreign key columns that don't have covering indexes
    - This improves JOIN performance and foreign key constraint checks
  
  2. Indexes Added
    - accounts.user_id
    - admin_sessions.admin_user_id
    - budgets.category_id
    - budgets.user_id
    - categories.user_id
    - recurring_rules.account_id
    - recurring_rules.category_id
    - recurring_rules.user_id
    - split_expense_participants.friend_id
    - split_expenses.payer_friend_id
    - split_settlements.from_friend_id
    - split_settlements.to_friend_id
*/

-- Add index for accounts.user_id
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Add index for admin_sessions.admin_user_id
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);

-- Add index for budgets.category_id
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);

-- Add index for budgets.user_id
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- Add index for categories.user_id
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Add index for recurring_rules.account_id
CREATE INDEX IF NOT EXISTS idx_recurring_rules_account_id ON recurring_rules(account_id);

-- Add index for recurring_rules.category_id
CREATE INDEX IF NOT EXISTS idx_recurring_rules_category_id ON recurring_rules(category_id);

-- Add index for recurring_rules.user_id
CREATE INDEX IF NOT EXISTS idx_recurring_rules_user_id ON recurring_rules(user_id);

-- Add index for split_expense_participants.friend_id
CREATE INDEX IF NOT EXISTS idx_split_expense_participants_friend_id ON split_expense_participants(friend_id);

-- Add index for split_expenses.payer_friend_id
CREATE INDEX IF NOT EXISTS idx_split_expenses_payer_friend_id ON split_expenses(payer_friend_id);

-- Add index for split_settlements.from_friend_id
CREATE INDEX IF NOT EXISTS idx_split_settlements_from_friend_id ON split_settlements(from_friend_id);

-- Add index for split_settlements.to_friend_id
CREATE INDEX IF NOT EXISTS idx_split_settlements_to_friend_id ON split_settlements(to_friend_id);