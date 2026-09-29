-- MultiSport Database Initialization Script
-- Executed on initial container bootstrap by PostgreSQL docker-entrypoint

-- 1. Enable GiST B-Tree extension for exclusion constraints (exc_bookings_no_overlap)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Create runtime application user if not exists (Least Privilege Principle)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'multisport_app') THEN
        CREATE ROLE multisport_app WITH LOGIN PASSWORD 'applocalpassword';
    END IF;
END
$$;

-- 3. Grant basic connection privileges
GRANT CONNECT ON DATABASE multisport_dev TO multisport_app;
GRANT USAGE ON SCHEMA public TO multisport_app;

-- 4. Configure default privileges for future tables created by FluentMigrator (postgres role)
-- Allows multisport_app to perform DML (SELECT, INSERT, UPDATE, DELETE) without granting DDL (ALTER, DROP)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO multisport_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO multisport_app;
