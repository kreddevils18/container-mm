-- PostgreSQL Database Initialization Script
-- Creates additional databases and configures extensions

-- Create additional databases (main database already exists from POSTGRES_DB)
CREATE DATABASE container_mm;
CREATE DATABASE container_mm_test;

-- Connect to the main database
\c container_mm;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Connect to the dev database (already created as POSTGRES_DB)
\c container_mm_dev;

-- Enable required extensions for dev database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Connect to the test database
\c container_mm_test;

-- Enable required extensions for test database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";