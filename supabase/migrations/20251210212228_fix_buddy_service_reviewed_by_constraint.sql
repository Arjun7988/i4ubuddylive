/*
  # Fix reviewed_by foreign key constraint

  1. Changes
    - Drop the foreign key constraint on `reviewed_by` that points to `auth.users`
    - The field remains nullable and can now reference admin_users IDs
    - This allows admin users to review requests without needing to be in auth.users

  2. Reason
    - Admin users are stored in `admin_users` table, not `auth.users`
    - The constraint was preventing admins from approving requests
*/

-- Drop the foreign key constraint on reviewed_by
ALTER TABLE buddy_service_requests
DROP CONSTRAINT IF EXISTS buddy_service_requests_reviewed_by_fkey;
