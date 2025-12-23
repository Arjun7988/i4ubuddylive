/*
  # Update Ads Pages to Array
  
  1. Changes
    - Modify `page` column from text to text[] to support multiple pages per ad
    - Update existing ads to convert single page to array format
    - Drop old page index and create new one for array queries
    
  2. Backward Compatibility
    - Existing ads will have their page value converted to single-element array
    - All queries will be updated to use array operations
*/

-- Step 1: Add new pages column as array
ALTER TABLE ads ADD COLUMN IF NOT EXISTS pages text[];

-- Step 2: Migrate existing data from page to pages
UPDATE ads SET pages = ARRAY[page] WHERE pages IS NULL;

-- Step 3: Make pages NOT NULL
ALTER TABLE ads ALTER COLUMN pages SET NOT NULL;

-- Step 4: Drop old page column
ALTER TABLE ads DROP COLUMN IF EXISTS page;

-- Step 5: Drop old index on page column
DROP INDEX IF EXISTS idx_ads_page_placement;

-- Step 6: Create new index for pages array queries
CREATE INDEX IF NOT EXISTS idx_ads_pages_gin ON ads USING gin(pages);
CREATE INDEX IF NOT EXISTS idx_ads_placement ON ads(placement);
