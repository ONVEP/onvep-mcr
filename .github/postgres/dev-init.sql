-- Runs with ON_ERROR_STOP on a fresh volume: every statement must tolerate objects the image
-- already created (POSTGRES_USER and its database are usually root / postgres here).
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'root') THEN
    CREATE USER root WITH ENCRYPTED PASSWORD 'root';
  END IF;
END
$$;

-- CREATE DATABASE can't run inside a DO block: \gexec runs the generated statement, if any.
SELECT 'CREATE DATABASE postgres'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'postgres')\gexec
SELECT 'CREATE DATABASE context_engine'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'context_engine')\gexec
SELECT 'CREATE DATABASE context_engine_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'context_engine_test')\gexec

GRANT ALL PRIVILEGES ON DATABASE postgres TO root;
GRANT ALL PRIVILEGES ON DATABASE context_engine TO root;
GRANT ALL PRIVILEGES ON DATABASE context_engine_test TO root;
