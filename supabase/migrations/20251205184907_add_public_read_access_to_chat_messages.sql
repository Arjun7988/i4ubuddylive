/*
  # Add Public Read Access to Chat Messages

  1. Changes
    - Add policy to allow anonymous (public) users to read all chat messages
    - This enables the Community Highlights section on the landing page to display messages to non-authenticated visitors

  2. Security
    - Read-only access for anonymous users
    - Write operations (insert, update, delete) still require authentication
*/

CREATE POLICY "Allow public read access to chat messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (true);
