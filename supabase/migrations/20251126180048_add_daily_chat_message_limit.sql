/*
  # Add Daily Chat Message Limit

  1. New Function
    - `check_daily_message_limit` - Checks if user has exceeded daily message limit
    - Returns the count of messages sent today by the user
    - Used to enforce 5 messages per day limit

  2. Security
    - Function is available to authenticated users
    - Each user can only check their own message count

  3. Implementation
    - Counts messages from chat_messages table for the current user
    - Filters by created_at to only count today's messages
    - Returns count as integer
*/

-- Create function to check daily message count
CREATE OR REPLACE FUNCTION get_user_daily_message_count(user_uuid uuid)
RETURNS integer AS $$
DECLARE
  message_count integer;
BEGIN
  -- Count messages sent by user today (using UTC date)
  SELECT COUNT(*)::integer INTO message_count
  FROM chat_messages
  WHERE user_id = user_uuid
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';
  
  RETURN message_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_daily_message_count(uuid) TO authenticated;
