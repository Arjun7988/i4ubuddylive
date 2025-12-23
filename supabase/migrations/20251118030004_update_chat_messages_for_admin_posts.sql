/*
  # Update Chat Messages for Admin Posts

  1. Changes to chat_messages table
    - Make user_id nullable to allow admin posts without user account
    - Add admin_name column (text, nullable) to store admin name

  2. Security Updates
    - Update policies to allow admin posts without user_id
    - Ensure admins can insert messages without user_id constraint

  3. Notes
    - When admin_name is set, display that instead of user profile name
    - Regular users must still have user_id
*/

-- Make user_id nullable for admin posts
ALTER TABLE chat_messages ALTER COLUMN user_id DROP NOT NULL;

-- Add admin_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'admin_name'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN admin_name text;
  END IF;
END $$;

-- Drop existing insert policy
DROP POLICY IF EXISTS "Authenticated users can insert their own messages" ON chat_messages;

-- Create new insert policy that allows both user messages and admin messages
CREATE POLICY "Authenticated users can insert their own messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR 
    (user_id IS NULL AND admin_name IS NOT NULL AND EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
    ))
  );

-- Add policy for admins to insert messages without user_id
CREATE POLICY "Admins can insert admin messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
    )
  );
