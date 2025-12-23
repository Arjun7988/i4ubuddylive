/*
  # Fix Ad Placement Naming Convention
  
  Updates existing ads that use the old placement naming to match the new standardized format:
  - HOME_SIDEBAR → HOME_RIGHT
  
  This ensures all ads use consistent placement naming across the system.
*/

-- Update HOME_SIDEBAR to HOME_RIGHT for consistency
UPDATE ads 
SET placement = 'HOME_RIGHT' 
WHERE placement = 'HOME_SIDEBAR';
