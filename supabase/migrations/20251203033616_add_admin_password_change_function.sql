/*
  # Add Admin Password Change Function

  1. New Functions
    - `change_admin_password`: Validates current password and updates to new password
    
  2. Security
    - Function uses bcrypt extension for password hashing
    - Validates current password before allowing change
    - Returns success/error status
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to change admin password
CREATE OR REPLACE FUNCTION change_admin_password(
  p_admin_id uuid,
  p_current_password text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stored_hash text;
  v_new_hash text;
BEGIN
  -- Get the current password hash
  SELECT password_hash INTO v_stored_hash
  FROM admin_users
  WHERE id = p_admin_id;

  -- Check if admin exists
  IF v_stored_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin user not found');
  END IF;

  -- Verify current password using crypt
  IF v_stored_hash != crypt(p_current_password, v_stored_hash) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Current password is incorrect');
  END IF;

  -- Hash the new password
  v_new_hash := crypt(p_new_password, gen_salt('bf', 10));

  -- Update the password
  UPDATE admin_users
  SET 
    password_hash = v_new_hash,
    updated_at = now()
  WHERE id = p_admin_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
