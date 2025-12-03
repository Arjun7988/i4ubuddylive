/*
  # Travel Companion Posts System

  1. New Tables
    - `travel_posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `content` (text) - Message content
      - `image_url` (text, optional) - Attached image URL
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `travel_post_reactions`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references travel_posts)
      - `user_id` (uuid, references profiles)
      - `reaction` (text) - Emoji reaction (❤️, 😂, 😮, 😢, 😠, 👍)
      - `created_at` (timestamptz)
      - Unique constraint on (post_id, user_id, reaction) - one reaction type per user per post
    
    - `travel_post_permissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `can_post` (boolean) - Permission to create posts
      - `can_delete_own` (boolean) - Permission to delete own posts
      - `can_delete_any` (boolean) - Admin permission to delete any post
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint on user_id

  2. Security
    - Enable RLS on all tables
    - Travel posts: Anyone authenticated can read, only users with can_post permission can create
    - Reactions: Anyone authenticated can read, authenticated users can add/remove their own reactions
    - Permissions: Only admins can manage permissions, users can read their own
*/

-- Create travel_posts table
CREATE TABLE IF NOT EXISTS travel_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create travel_post_reactions table
CREATE TABLE IF NOT EXISTS travel_post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES travel_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction text NOT NULL CHECK (reaction IN ('❤️', '😂', '😮', '😢', '😠', '👍')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, reaction)
);

-- Create travel_post_permissions table
CREATE TABLE IF NOT EXISTS travel_post_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  can_post boolean DEFAULT true,
  can_delete_own boolean DEFAULT true,
  can_delete_any boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_travel_posts_user_id ON travel_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_posts_created_at ON travel_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_post_reactions_post_id ON travel_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_travel_post_reactions_user_id ON travel_post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_post_permissions_user_id ON travel_post_permissions(user_id);

-- Enable RLS
ALTER TABLE travel_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_post_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for travel_posts

-- Anyone authenticated can view posts
CREATE POLICY "Authenticated users can view travel posts"
  ON travel_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Users with permission can create posts
CREATE POLICY "Users with permission can create travel posts"
  ON travel_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      EXISTS (
        SELECT 1 FROM travel_post_permissions
        WHERE user_id = auth.uid() AND can_post = true
      ) OR
      NOT EXISTS (
        SELECT 1 FROM travel_post_permissions
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update their own posts if they have permission
CREATE POLICY "Users can update own travel posts"
  ON travel_posts
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      EXISTS (
        SELECT 1 FROM travel_post_permissions
        WHERE user_id = auth.uid() AND can_delete_own = true
      ) OR
      NOT EXISTS (
        SELECT 1 FROM travel_post_permissions
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own posts or admins can delete any
CREATE POLICY "Users can delete own posts or admins can delete any"
  ON travel_posts
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM travel_post_permissions
      WHERE user_id = auth.uid() AND can_delete_any = true
    )
  );

-- RLS Policies for travel_post_reactions

-- Anyone authenticated can view reactions
CREATE POLICY "Authenticated users can view reactions"
  ON travel_post_reactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add reactions"
  ON travel_post_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
  ON travel_post_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for travel_post_permissions

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions"
  ON travel_post_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only admins can manage permissions (for now, we'll handle this through service role)

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_travel_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for travel_posts
DROP TRIGGER IF EXISTS travel_posts_updated_at ON travel_posts;
CREATE TRIGGER travel_posts_updated_at
  BEFORE UPDATE ON travel_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_travel_post_updated_at();

-- Trigger for travel_post_permissions
DROP TRIGGER IF EXISTS travel_post_permissions_updated_at ON travel_post_permissions;
CREATE TRIGGER travel_post_permissions_updated_at
  BEFORE UPDATE ON travel_post_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_travel_post_updated_at();