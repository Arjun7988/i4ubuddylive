/*
  # Enforce Daily Chat Message Limit

  1. New Trigger Function
    - `check_daily_message_limit_trigger` - Trigger function that prevents inserting more than 5 messages per day
    - Raises an exception if user has already sent 5 messages today
    - Admin users are exempt from this limit

  2. Changes
    - Add BEFORE INSERT trigger on chat_messages table
    - Check if user has exceeded daily limit before allowing insert
    - Return helpful error message to user

  3. Security
    - Enforces limit at database level (cannot be bypassed)
    - Admin users can send unlimited messages
    - Counts only messages from current day (UTC)
*/

-- Create trigger function to check message limit before insert
CREATE OR REPLACE FUNCTION check_daily_message_limit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  message_count integer;
  is_admin boolean;
BEGIN
  -- Skip check if user_id is null (admin posts)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if user is admin
  SELECT profiles.is_admin INTO is_admin
  FROM profiles
  WHERE profiles.id = NEW.user_id;

  -- Allow unlimited messages for admins
  IF is_admin = true THEN
    RETURN NEW;
  END IF;

  -- Count messages sent today by this user
  SELECT COUNT(*) INTO message_count
  FROM chat_messages
  WHERE user_id = NEW.user_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';

  -- Raise exception if limit exceeded
  IF message_count >= 5 THEN
    RAISE EXCEPTION 'Daily message limit exceeded. You can send up to 5 messages per day. Please try again tomorrow.'
      USING HINT = 'Wait until tomorrow to send more messages',
            ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_daily_message_limit ON chat_messages;

-- Create trigger on chat_messages
CREATE TRIGGER enforce_daily_message_limit
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_message_limit_trigger();
