/*
  # Add Pinned Messages Functionality to Chat

  1. Changes to chat_messages table
    - Add `is_pinned` column (boolean, default false)
    - Add `pinned_at` column (timestamptz, nullable)
    - Add `pinned_by` column (uuid, nullable, reference to admin who pinned)

  2. Security Updates
    - Add policy for admins to delete any message
    - Add policy for admins to pin/unpin messages
    - Update existing policies to work with new columns

  3. Indexes
    - Add index on is_pinned for faster queries
*/

-- Add pinned message columns to chat_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN is_pinned boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'pinned_at'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN pinned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'pinned_by'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN pinned_by text;
  END IF;
END $$;

-- Create index on is_pinned
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_pinned ON chat_messages(is_pinned) WHERE is_pinned = true;

-- Drop existing admin management policy if it exists
DROP POLICY IF EXISTS "Admins can delete any message" ON chat_messages;
DROP POLICY IF EXISTS "Admins can update any message" ON chat_messages;

-- Allow admins to delete any message
CREATE POLICY "Admins can delete any message"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
    )
  );

-- Allow admins to update any message (for pinning)
CREATE POLICY "Admins can update any message"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
    )
  );
