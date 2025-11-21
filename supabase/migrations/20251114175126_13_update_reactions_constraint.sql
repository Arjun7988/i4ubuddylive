/*
  # Update Travel Post Reactions

  1. Changes
    - Drop the old CHECK constraint on reactions
    - Add new CHECK constraint with expanded reaction types
    - Support reactions: ❤️, 👍, 👎, 😂, 😮, 😢, 😡, 🎉, 🔥, 👏, ✅, ❌, 💯, 🙏, 💪, 👀, 🤔, 😊, 😍, 🥳

  2. Notes
    - Existing reactions will continue to work
    - New reactions are now available for users
*/

-- Drop the old constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'travel_post_reactions_reaction_check'
  ) THEN
    ALTER TABLE travel_post_reactions DROP CONSTRAINT travel_post_reactions_reaction_check;
  END IF;
END $$;

-- Add new constraint with expanded reactions
ALTER TABLE travel_post_reactions 
ADD CONSTRAINT travel_post_reactions_reaction_check 
CHECK (reaction IN (
  '❤️', '👍', '👎', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏',
  '✅', '❌', '💯', '🙏', '💪', '👀', '🤔', '😊', '😍', '🥳'
));