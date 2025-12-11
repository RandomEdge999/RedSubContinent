-- PostgreSQL initialization script for Red SubContinent
-- This runs when the container is first created

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Tables are created via Alembic migrations from the API service
-- This script only enables extensions needed by the application

-- Verify PostGIS is working
SELECT PostGIS_Version();
