/*
  # Make account_id nullable in transactions table

  1. Changes
    - Make `account_id` column nullable in `transactions` table
    - This allows transactions to be created without requiring an account
  
  2. Reason
    - Category and account fields have been removed from the transaction form
    - Users should be able to add transactions without specifying an account
*/

ALTER TABLE transactions 
ALTER COLUMN account_id DROP NOT NULL;
