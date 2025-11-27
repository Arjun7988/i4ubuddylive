/*
  # Add Reply and Image Support to Chat Messages

  ## Changes Made

  1. **Add Reply Support**
     - Add reply_to_message_id column to reference parent messages
     - Add foreign key constraint for data integrity

  2. **Add Image Support**
     - Add image_url column to store uploaded images
     - Images will be stored in Supabase Storage

  ## New Columns
  - reply_to_message_id: UUID reference to parent message
  - image_url: Text field for image URL
*/

-- Add reply_to_message_id column to support message replies
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Add image_url column to support image attachments
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS image_url text;

-- Create index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to_message_id);

-- Create storage bucket for chat images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat images" ON storage.objects;

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload chat images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-images');

-- Create policy to allow anyone to view chat images
CREATE POLICY "Anyone can view chat images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'chat-images');

-- Create policy to allow users to delete their own images
CREATE POLICY "Users can delete their own chat images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-images' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );
