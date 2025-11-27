/*
  # Create Admin Credentials System

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password_hash` (text)
      - `email` (text, unique)
      - `full_name` (text)
      - `is_super_admin` (boolean)
      - `last_login` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on admin_users table
    - Only authenticated admin users can read their own data
    - Password is hashed, never stored in plain text

  3. Initial Admin Account
    - Username: admin
    - Password: Admin@123 (please change after first login)
    - Email: admin@financeai.com
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  is_super_admin boolean DEFAULT false,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to read their own data
CREATE POLICY "Admin users can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Create policy for admin users to update their own data
CREATE POLICY "Admin users can update own data"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create default admin account
-- Password: Admin@123 (bcrypt hash with 10 rounds)
INSERT INTO admin_users (username, email, password_hash, full_name, is_super_admin)
VALUES (
  'admin',
  'admin@financeai.com',
  '$2a$10$YQ98DjqB4m5v.5iF5KxHOu7T3YqhqLqJxN5fJZ8X8cH0nOKqECxsK',
  'System Administrator',
  true
)
ON CONFLICT (username) DO NOTHING;

-- Create admin sessions table for tracking logins
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can access own sessions"
  ON admin_sessions
  FOR ALL
  TO authenticated
  USING (admin_user_id = auth.uid());
