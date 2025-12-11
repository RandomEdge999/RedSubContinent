"""
SQLAlchemy models for conflict data.

Uses PostGIS via GeoAlchemy2 for spatial data.
"""

import enum
from datetime import date, datetime
from typing import Optional
from uuid import uuid4

from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class ConflictType(str, enum.Enum):
    """Categories of historical conflicts."""
    
    WAR = "war"
    INVASION = "invasion"
    MASSACRE = "massacre"
    RIOT = "riot"
    FAMINE = "famine"
    PARTITION_EVENT = "partition_event"
    UPRISING = "uprising"
    IMPERIAL_CAMPAIGN = "imperial_campaign"
    CIVIL_CONFLICT = "civil_conflict"
    COMMUNAL_VIOLENCE = "communal_violence"
    OTHER = "other"


class ConflictScale(str, enum.Enum):
    """Geographic scale of the conflict."""
    
    LOCAL = "local"
    REGIONAL = "regional"
    SUBCONTINENTAL = "subcontinental"
    INTERNATIONAL = "international"


class ActorRole(str, enum.Enum):
    """Role of an actor in a conflict."""
    
    AGGRESSOR = "aggressor"
    DEFENDER = "defender"
    COLONIAL_POWER = "colonial_power"
    REBEL_GROUP = "rebel_group"
    EMPIRE = "empire"
    KINGDOM = "kingdom"
    STATE = "state"
    OTHER = "other"


class SourceType(str, enum.Enum):
    """Type of data source."""
    
    WIKIPEDIA = "wikipedia"
    BOOK = "book"
    ACADEMIC_PAPER = "academic_paper"
    DATABASE = "database"
    GOVERNMENT_RECORD = "government_record"
    OTHER = "other"


class Conflict(Base):
    """Main conflicts table."""
    
    __tablename__ = "conflicts"
    
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    
    conflict_type: Mapped[ConflictType] = mapped_column(
        Enum(ConflictType, name="conflict_type"),
        nullable=False,
    )
    conflict_scale: Mapped[ConflictScale] = mapped_column(
        Enum(ConflictScale, name="conflict_scale"),
        default=ConflictScale.REGIONAL,
    )
    
    description_short: Mapped[Optional[str]] = mapped_column(Text)
    description_long: Mapped[Optional[str]] = mapped_column(Text)
    
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    date_precision: Mapped[str] = mapped_column(String(50), default="year")
    
    # Casualty estimates
    casualties_low: Mapped[Optional[int]] = mapped_column(Integer)
    casualties_high: Mapped[Optional[int]] = mapped_column(Integer)
    casualties_best: Mapped[Optional[int]] = mapped_column(Integer)
    casualties_includes_injuries: Mapped[bool] = mapped_column(Boolean, default=False)
    
    primary_region: Mapped[Optional[str]] = mapped_column(String(255))
    
    notes: Mapped[Optional[str]] = mapped_column(Text)
    uncertainty_notes: Mapped[Optional[str]] = mapped_column(Text)
    content_warning: Mapped[Optional[str]] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    
    # Relationships
    locations: Mapped[list["ConflictLocation"]] = relationship(
        back_populates="conflict",
        cascade="all, delete-orphan",
    )
    actors: Mapped[list["ConflictActor"]] = relationship(
        back_populates="conflict",
        cascade="all, delete-orphan",
    )
    sources: Mapped[list["ConflictSource"]] = relationship(
        back_populates="conflict",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<Conflict(id={self.id}, title='{self.title}')>"


class ConflictLocation(Base):
    """Geographic locations for conflicts."""
    
    __tablename__ = "conflict_locations"
    
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    conflict_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conflicts.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    location_name: Mapped[Optional[str]] = mapped_column(String(500))
    location_type: Mapped[Optional[str]] = mapped_column(String(100))
    
    # PostGIS geometry column (can be POINT or POLYGON)
    geo = mapped_column(Geometry("GEOMETRY", srid=4326))
    
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Relationship
    conflict: Mapped["Conflict"] = relationship(back_populates="locations")
    
    def __repr__(self) -> str:
        return f"<ConflictLocation(id={self.id}, name='{self.location_name}')>"


class ConflictActor(Base):
    """Actors (belligerents, empires, groups) in conflicts."""
    
    __tablename__ = "conflict_actors"
    
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    conflict_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conflicts.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    actor_name: Mapped[str] = mapped_column(String(500), nullable=False)
    actor_role: Mapped[ActorRole] = mapped_column(
        Enum(ActorRole, name="actor_role"),
        nullable=False,
    )
    
    casualties_for_actor: Mapped[Optional[int]] = mapped_column(Integer)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Relationship
    conflict: Mapped["Conflict"] = relationship(back_populates="actors")
    
    def __repr__(self) -> str:
        return f"<ConflictActor(id={self.id}, name='{self.actor_name}')>"


class ConflictSource(Base):
    """Sources and references for conflict data."""
    
    __tablename__ = "conflict_sources"
    
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    conflict_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conflicts.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    source_type: Mapped[SourceType] = mapped_column(
        Enum(SourceType, name="source_type"),
        nullable=False,
    )
    source_title: Mapped[Optional[str]] = mapped_column(String(1000))
    source_url: Mapped[Optional[str]] = mapped_column(Text)
    citation_text: Mapped[Optional[str]] = mapped_column(Text)
    accessed_date: Mapped[Optional[date]] = mapped_column(Date)
    reliability_notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Relationship
    conflict: Mapped["Conflict"] = relationship(back_populates="sources")
    
    def __repr__(self) -> str:
        return f"<ConflictSource(id={self.id}, title='{self.source_title}')>"


class HistoricalBoundary(Base):
    """Historical political boundaries for map overlays."""
    
    __tablename__ = "historical_boundaries"
    
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    era_name: Mapped[Optional[str]] = mapped_column(String(255))
    start_year: Mapped[Optional[int]] = mapped_column(Integer)
    end_year: Mapped[Optional[int]] = mapped_column(Integer)
    
    # PostGIS multipolygon for boundaries
    boundary = mapped_column(Geometry("MULTIPOLYGON", srid=4326))
    
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    def __repr__(self) -> str:
        return f"<HistoricalBoundary(id={self.id}, name='{self.name}')>"
