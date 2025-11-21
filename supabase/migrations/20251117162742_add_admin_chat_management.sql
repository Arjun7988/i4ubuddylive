/*
  # Add Admin Chat Management Policies

  1. Changes
    - Add policy for admin users to delete any chat message
    - Keep existing policy for users to delete their own messages

  2. Security
    - Admin users (with is_admin = true in profiles table) can delete any message
    - Regular users can only delete their own messages
*/

-- Add policy for admin to delete any chat message
CREATE POLICY "Admin can delete any chat message"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
