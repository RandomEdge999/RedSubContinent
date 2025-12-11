"""Initial schema with PostGIS

Revision ID: 001
Revises: 
Create Date: 2024-12-11

Initial database schema including:
- conflicts table
- conflict_locations with PostGIS geometry
- conflict_actors
- conflict_sources
- historical_boundaries
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2

# revision identifiers
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable PostGIS extension (should already be enabled by init.sql)
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis')
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    # Create enum types using raw SQL for reliability
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE conflict_type AS ENUM (
                'war', 'invasion', 'massacre', 'riot', 'famine',
                'partition_event', 'uprising', 'imperial_campaign',
                'civil_conflict', 'communal_violence', 'other'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE conflict_scale AS ENUM (
                'local', 'regional', 'subcontinental', 'international'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE actor_role AS ENUM (
                'aggressor', 'defender', 'colonial_power', 'rebel_group',
                'empire', 'kingdom', 'state', 'other'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE source_type AS ENUM (
                'wikipedia', 'book', 'academic_paper', 'database',
                'government_record', 'other'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create conflicts table
    op.execute("""
        CREATE TABLE conflicts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(500) NOT NULL,
            slug VARCHAR(500) UNIQUE NOT NULL,
            conflict_type conflict_type NOT NULL,
            conflict_scale conflict_scale DEFAULT 'regional',
            description_short TEXT,
            description_long TEXT,
            start_date DATE,
            end_date DATE,
            date_precision VARCHAR(50) DEFAULT 'year',
            casualties_low INTEGER,
            casualties_high INTEGER,
            casualties_best INTEGER,
            casualties_includes_injuries BOOLEAN DEFAULT FALSE,
            primary_region VARCHAR(255),
            notes TEXT,
            uncertainty_notes TEXT,
            content_warning TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    
    # Create indexes on conflicts
    op.execute('CREATE INDEX idx_conflicts_type ON conflicts(conflict_type)')
    op.execute('CREATE INDEX idx_conflicts_dates ON conflicts(start_date, end_date)')
    op.execute('CREATE INDEX idx_conflicts_casualties ON conflicts(casualties_best)')
    op.execute('CREATE INDEX idx_conflicts_slug ON conflicts(slug)')
    
    # Create conflict_locations table with PostGIS geometry
    op.execute("""
        CREATE TABLE conflict_locations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conflict_id UUID NOT NULL REFERENCES conflicts(id) ON DELETE CASCADE,
            location_name VARCHAR(500),
            location_type VARCHAR(100),
            geo GEOMETRY(GEOMETRY, 4326),
            is_primary BOOLEAN DEFAULT FALSE,
            notes TEXT
        )
    """)
    
    # Create spatial index
    op.execute('CREATE INDEX idx_conflict_locations_geo ON conflict_locations USING GIST(geo)')
    op.execute('CREATE INDEX idx_conflict_locations_conflict ON conflict_locations(conflict_id)')
    
    # Create conflict_actors table
    op.execute("""
        CREATE TABLE conflict_actors (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conflict_id UUID NOT NULL REFERENCES conflicts(id) ON DELETE CASCADE,
            actor_name VARCHAR(500) NOT NULL,
            actor_role actor_role NOT NULL,
            casualties_for_actor INTEGER,
            notes TEXT
        )
    """)
    
    op.execute('CREATE INDEX idx_conflict_actors_conflict ON conflict_actors(conflict_id)')
    op.execute('CREATE INDEX idx_conflict_actors_name ON conflict_actors(actor_name)')
    
    # Create conflict_sources table
    op.execute("""
        CREATE TABLE conflict_sources (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conflict_id UUID NOT NULL REFERENCES conflicts(id) ON DELETE CASCADE,
            source_type source_type NOT NULL,
            source_title VARCHAR(1000),
            source_url TEXT,
            citation_text TEXT,
            accessed_date DATE,
            reliability_notes TEXT
        )
    """)
    
    op.execute('CREATE INDEX idx_conflict_sources_conflict ON conflict_sources(conflict_id)')
    
    # Create historical_boundaries table
    op.execute("""
        CREATE TABLE historical_boundaries (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(500) NOT NULL,
            era_name VARCHAR(255),
            start_year INTEGER,
            end_year INTEGER,
            boundary GEOMETRY(MULTIPOLYGON, 4326),
            notes TEXT
        )
    """)
    
    op.execute('CREATE INDEX idx_historical_boundaries_geo ON historical_boundaries USING GIST(boundary)')
    op.execute('CREATE INDEX idx_historical_boundaries_years ON historical_boundaries(start_year, end_year)')


def downgrade() -> None:
    # Drop tables
    op.execute('DROP TABLE IF EXISTS historical_boundaries CASCADE')
    op.execute('DROP TABLE IF EXISTS conflict_sources CASCADE')
    op.execute('DROP TABLE IF EXISTS conflict_actors CASCADE')
    op.execute('DROP TABLE IF EXISTS conflict_locations CASCADE')
    op.execute('DROP TABLE IF EXISTS conflicts CASCADE')
    
    # Drop enum types
    op.execute('DROP TYPE IF EXISTS source_type')
    op.execute('DROP TYPE IF EXISTS actor_role')
    op.execute('DROP TYPE IF EXISTS conflict_scale')
    op.execute('DROP TYPE IF EXISTS conflict_type')
