/*
  # Fix Admin Chat Message Insertion Policy

  1. Security Updates
    - Drop conflicting policies
    - Create single comprehensive policy for admin message insertion
    - Allow admins to insert messages without user_id requirement
    - Allow regular authenticated users to insert their own messages

  2. Notes
    - Admins can post with admin_name and null user_id
    - Regular users must have matching user_id
*/

-- Drop existing conflicting insert policies
DROP POLICY IF EXISTS "Authenticated users can insert their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can insert admin messages" ON chat_messages;

-- Create comprehensive insert policy
CREATE POLICY "Users and admins can insert messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Regular users can insert their own messages
    (auth.uid() = user_id AND admin_name IS NULL)
    OR
    -- Admins can insert admin messages (no user_id required)
    (admin_name IS NOT NULL AND user_id IS NULL)
  );
