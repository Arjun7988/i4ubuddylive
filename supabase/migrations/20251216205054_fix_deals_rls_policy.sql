/*
  # Fix Deals RLS Policy for Public Access

  1. Changes
    - Drop existing public SELECT policy
    - Create new policy that allows viewing active deals
    - Handles NULL valid_until values (treats as never expiring)
    - Deals with valid_until in the future are visible
    - Deals with NULL valid_until are visible

  2. Security
    - Maintains restriction to only active deals
    - Only allows SELECT operations
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view active deals" ON deals;

-- Create new policy that handles NULL valid_until
CREATE POLICY "Anyone can view active deals"
  ON deals
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND (valid_until IS NULL OR valid_until > now())
  );
