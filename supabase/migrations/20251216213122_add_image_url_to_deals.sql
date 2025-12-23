/*
  # Add Deal Banner Image Support

  1. Changes
    - Add `image_url` column to `deals` table for deal banner images
    - This allows merchants to upload custom banner images for their deals
    - Field is optional (nullable) to maintain backward compatibility

  2. Notes
    - Images will be stored in Supabase storage
    - Frontend will handle image uploads via SingleImageUpload component
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE deals ADD COLUMN image_url text;
  END IF;
END $$;