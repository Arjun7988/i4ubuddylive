/*
  # Create Buddy Service Sub-Categories Table

  1. New Tables
    - `buddy_service_subcategories`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to buddy_service_categories)
      - `name` (text, subcategory name)
      - `slug` (text, URL-friendly version of name)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - No RLS (admin-only table accessed through admin dashboard)
    
  3. Indexes
    - Index on category_id for faster lookups
    - Index on slug for URL routing
*/

-- Create buddy_service_subcategories table
CREATE TABLE IF NOT EXISTS buddy_service_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES buddy_service_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_buddy_service_subcategories_category_id 
  ON buddy_service_subcategories(category_id);

CREATE INDEX IF NOT EXISTS idx_buddy_service_subcategories_slug 
  ON buddy_service_subcategories(slug);

CREATE INDEX IF NOT EXISTS idx_buddy_service_subcategories_active 
  ON buddy_service_subcategories(is_active);

-- Create unique constraint on category_id + slug combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_buddy_service_subcategories_category_slug 
  ON buddy_service_subcategories(category_id, slug);

-- No RLS needed (admin-only table)
ALTER TABLE buddy_service_subcategories DISABLE ROW LEVEL SECURITY;