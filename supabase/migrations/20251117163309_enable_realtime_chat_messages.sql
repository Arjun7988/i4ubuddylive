/*
  # Enable Realtime for Chat Messages

  1. Changes
    - Enable realtime replication for chat_messages table
    - This allows instant updates when messages are inserted, updated, or deleted

  2. Notes
    - Realtime must be enabled for the subscription to work
    - Messages will now appear instantly without page reload
*/

-- Enable realtime for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
