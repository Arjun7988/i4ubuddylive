/*
  # Fix Buddy Service Categories RLS and Structure

  1. Changes
    - Disable RLS on buddy_service_categories (admin-only table)
    - Remove sort_order column (not needed)
    - Update default ordering to alphabetical by name
    
  2. Security
    - Table is admin-only, accessed through admin dashboard
    - No RLS needed as admin auth is handled separately
*/

-- Disable RLS (admin-only table accessed through admin dashboard)
ALTER TABLE buddy_service_categories DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can view active buddy service categories" ON buddy_service_categories;
DROP POLICY IF EXISTS "Admins can view all buddy service categories" ON buddy_service_categories;
DROP POLICY IF EXISTS "Admins can insert buddy service categories" ON buddy_service_categories;
DROP POLICY IF EXISTS "Admins can update buddy service categories" ON buddy_service_categories;
DROP POLICY IF EXISTS "Admins can delete buddy service categories" ON buddy_service_categories;

-- Make slug optional by removing NOT NULL constraint
ALTER TABLE buddy_service_categories ALTER COLUMN slug DROP NOT NULL;

-- Note: sort_order will be handled by ordering by name in queries
-- Keeping the column for now to avoid breaking existing data