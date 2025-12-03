/*
  # Create Invite Templates System

  1. New Tables
    - `template_categories`
      - `id` (uuid, primary key)
      - `name` (text, not null) - Category name like "Birthday", "Wedding"
      - `slug` (text, unique, not null) - URL-friendly identifier
      - `description` (text) - Optional description
      - `sort_order` (integer) - Display order
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz) - Creation timestamp

    - `event_templates`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key) - References template_categories
      - `name` (text, not null) - Template name
      - `image_url` (text, not null) - Full-size image URL
      - `thumbnail_url` (text) - Optional thumbnail URL
      - `editable_fields` (jsonb) - Future text overlay config
      - `is_active` (boolean) - Active status
      - `sort_order` (integer) - Display order
      - `created_at` (timestamptz) - Creation timestamp

  2. Table Updates
    - Add `template_id` to `rsvp_events` table
    - Add `template_custom_values` to `rsvp_events` table

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users and admins
    - Public read access for active templates
*/

-- Create template_categories table
CREATE TABLE IF NOT EXISTS template_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create event_templates table
CREATE TABLE IF NOT EXISTS event_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES template_categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  image_url text NOT NULL,
  thumbnail_url text,
  editable_fields jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add template columns to rsvp_events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN template_id uuid REFERENCES event_templates(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rsvp_events' AND column_name = 'template_custom_values'
  ) THEN
    ALTER TABLE rsvp_events ADD COLUMN template_custom_values jsonb;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_template_categories_slug ON template_categories(slug);
CREATE INDEX IF NOT EXISTS idx_template_categories_active ON template_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_event_templates_category ON event_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_event_templates_active ON event_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_rsvp_events_template ON rsvp_events(template_id);

-- Enable RLS
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;

-- Policies for template_categories
-- Public can read active categories
CREATE POLICY "Anyone can view active template categories"
  ON template_categories
  FOR SELECT
  USING (is_active = true);

-- Admins can view all categories
CREATE POLICY "Admins can view all template categories"
  ON template_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can insert categories
CREATE POLICY "Admins can insert template categories"
  ON template_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update categories
CREATE POLICY "Admins can update template categories"
  ON template_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can delete categories (if no templates)
CREATE POLICY "Admins can delete template categories"
  ON template_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policies for event_templates
-- Public can read active templates
CREATE POLICY "Anyone can view active event templates"
  ON event_templates
  FOR SELECT
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM template_categories
      WHERE template_categories.id = event_templates.category_id
      AND template_categories.is_active = true
    )
  );

-- Admins can view all templates
CREATE POLICY "Admins can view all event templates"
  ON event_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can insert templates
CREATE POLICY "Admins can insert event templates"
  ON event_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update templates
CREATE POLICY "Admins can update event templates"
  ON event_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can delete templates
CREATE POLICY "Admins can delete event templates"
  ON event_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Insert some default categories
INSERT INTO template_categories (name, slug, description, sort_order)
VALUES 
  ('Birthday', 'birthday', 'Birthday party invitations', 1),
  ('Wedding', 'wedding', 'Wedding and engagement invitations', 2),
  ('Kids Party', 'kids-party', 'Children''s party invitations', 3),
  ('Baby Shower', 'baby-shower', 'Baby shower invitations', 4),
  ('Holiday', 'holiday', 'Holiday celebration invitations', 5),
  ('Corporate', 'corporate', 'Business and corporate event invitations', 6)
ON CONFLICT (slug) DO NOTHING;
