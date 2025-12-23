/*
  # Add Customized Invite Image Support

  1. New Column
    - `customized_invite_url` (text) - URL of the customized invite image with text overlays

  2. Notes
    - This stores the final composed image that users create
    - Will be displayed on the public RSVP page
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'customized_invite_url'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN customized_invite_url text;
  END IF;
END $$;