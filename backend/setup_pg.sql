ALTER USER postgres PASSWORD 'mmsecret';

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mmuser') THEN
    CREATE ROLE mmuser WITH LOGIN PASSWORD 'mmsecret' CREATEDB;
  END IF;
END
$$;

SELECT datname FROM pg_database WHERE datname = 'marketmind';

-- Create database if it doesn't exist (can't use IF NOT EXISTS in plain SQL)
-- We'll handle this separately
