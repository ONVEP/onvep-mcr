CREATE USER root with encrypted password 'root';
CREATE DATABASE postgres;
GRANT ALL PRIVILEGES ON DATABASE postgres TO root;
CREATE DATABASE context_engine;
GRANT ALL PRIVILEGES ON DATABASE context_engine TO root;
CREATE DATABASE context_engine_test;
GRANT ALL PRIVILEGES ON DATABASE context_engine_test TO root;
