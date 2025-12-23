/*
  # Add Admin Login Verification Function

  1. New Functions
    - `verify_admin_login`: Verifies username and password against database
    
  2. Security
    - Function uses bcrypt for password verification
    - Returns admin user data and session token on success
    - Returns error on failure
*/

-- Function to verify admin login
CREATE OR REPLACE FUNCTION verify_admin_login(
  p_username text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_user admin_users;
  v_session_token text;
  v_expires_at timestamptz;
BEGIN
  -- Get admin user by username
  SELECT * INTO v_admin_user
  FROM admin_users
  WHERE username = p_username;

  -- Check if admin exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid username or password');
  END IF;

  -- Verify password using crypt
  IF v_admin_user.password_hash != crypt(p_password, v_admin_user.password_hash) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid username or password');
  END IF;

  -- Generate session token
  v_session_token := gen_random_uuid()::text;
  v_expires_at := now() + interval '24 hours';

  -- Create session
  INSERT INTO admin_sessions (admin_user_id, token, expires_at)
  VALUES (v_admin_user.id, v_session_token, v_expires_at);

  -- Update last login
  UPDATE admin_users
  SET last_login = now(), updated_at = now()
  WHERE id = v_admin_user.id;

  -- Return success with admin user data and token
  RETURN jsonb_build_object(
    'success', true,
    'token', v_session_token,
    'expires_at', v_expires_at,
    'admin_user', jsonb_build_object(
      'id', v_admin_user.id,
      'username', v_admin_user.username,
      'email', v_admin_user.email,
      'full_name', v_admin_user.full_name,
      'is_super_admin', v_admin_user.is_super_admin,
      'last_login', v_admin_user.last_login
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
