-- Create application user with appropriate permissions

DO $$
BEGIN
    -- Create app user if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'container_mm_user') THEN
        CREATE ROLE container_mm_user WITH LOGIN PASSWORD 'container_mm_password';
    END IF;
END
$$;

-- Grant permissions to the app user for all databases
GRANT CONNECT ON DATABASE container_mm TO container_mm_user;
GRANT CONNECT ON DATABASE container_mm_dev TO container_mm_user;
GRANT CONNECT ON DATABASE container_mm_test TO container_mm_user;

-- Connect to main database and grant schema permissions
\c container_mm;
GRANT USAGE ON SCHEMA public TO container_mm_user;
GRANT CREATE ON SCHEMA public TO container_mm_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO container_mm_user;
GRANT SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO container_mm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO container_mm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, UPDATE ON SEQUENCES TO container_mm_user;

-- Connect to dev database and grant schema permissions
\c container_mm_dev;
GRANT USAGE ON SCHEMA public TO container_mm_user;
GRANT CREATE ON SCHEMA public TO container_mm_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO container_mm_user;
GRANT SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO container_mm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO container_mm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, UPDATE ON SEQUENCES TO container_mm_user;

-- Connect to test database and grant schema permissions
\c container_mm_test;
GRANT USAGE ON SCHEMA public TO container_mm_user;
GRANT CREATE ON SCHEMA public TO container_mm_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO container_mm_user;
GRANT SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO container_mm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO container_mm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, UPDATE ON SEQUENCES TO container_mm_user;