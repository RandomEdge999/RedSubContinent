"""
Pydantic schemas for API request/response models.
"""

from datetime import date, datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# Enums (matching SQLAlchemy models)
class ConflictType(str, Enum):
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


class ConflictScale(str, Enum):
    LOCAL = "local"
    REGIONAL = "regional"
    SUBCONTINENTAL = "subcontinental"
    INTERNATIONAL = "international"


class ActorRole(str, Enum):
    AGGRESSOR = "aggressor"
    DEFENDER = "defender"
    COLONIAL_POWER = "colonial_power"
    REBEL_GROUP = "rebel_group"
    EMPIRE = "empire"
    KINGDOM = "kingdom"
    STATE = "state"
    OTHER = "other"


class SourceType(str, Enum):
    WIKIPEDIA = "wikipedia"
    BOOK = "book"
    ACADEMIC_PAPER = "academic_paper"
    DATABASE = "database"
    GOVERNMENT_RECORD = "government_record"
    OTHER = "other"


# Sub-schemas
class CasualtiesSchema(BaseModel):
    """Casualty estimates."""
    low: Optional[int] = None
    high: Optional[int] = None
    best_estimate: Optional[int] = None
    includes_injuries: bool = False


class LocationSchema(BaseModel):
    """Geographic location."""
    id: UUID
    name: Optional[str] = None
    location_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_primary: bool = False
    
    class Config:
        from_attributes = True


class ActorSchema(BaseModel):
    """Conflict actor."""
    id: UUID
    name: str
    role: ActorRole
    casualties: Optional[int] = None
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True


class SourceSchema(BaseModel):
    """Data source reference."""
    id: UUID
    source_type: SourceType
    title: Optional[str] = None
    url: Optional[str] = None
    citation_text: Optional[str] = None
    accessed_date: Optional[date] = None
    
    class Config:
        from_attributes = True


# Main conflict schemas
class ConflictBase(BaseModel):
    """Base conflict fields."""
    title: str
    conflict_type: ConflictType
    conflict_scale: ConflictScale = ConflictScale.REGIONAL
    description_short: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    date_precision: str = "year"
    casualties_low: Optional[int] = None
    casualties_high: Optional[int] = None
    casualties_best: Optional[int] = None
    primary_region: Optional[str] = None
    content_warning: Optional[str] = None


class ConflictListItem(BaseModel):
    """Conflict summary for list views."""
    id: UUID
    slug: str
    title: str
    conflict_type: ConflictType
    conflict_scale: ConflictScale
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    casualties_best: Optional[int] = None
    primary_region: Optional[str] = None
    primary_location: Optional[LocationSchema] = None
    
    class Config:
        from_attributes = True


class ConflictDetail(ConflictBase):
    """Full conflict details."""
    id: UUID
    slug: str
    description_long: Optional[str] = None
    casualties_includes_injuries: bool = False
    notes: Optional[str] = None
    uncertainty_notes: Optional[str] = None
    locations: list[LocationSchema] = []
    actors: list[ActorSchema] = []
    sources: list[SourceSchema] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ConflictCreate(ConflictBase):
    """Schema for creating a conflict."""
    slug: str
    description_long: Optional[str] = None
    notes: Optional[str] = None
    uncertainty_notes: Optional[str] = None


class ConflictUpdate(BaseModel):
    """Schema for updating a conflict."""
    title: Optional[str] = None
    conflict_type: Optional[ConflictType] = None
    conflict_scale: Optional[ConflictScale] = None
    description_short: Optional[str] = None
    description_long: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    casualties_low: Optional[int] = None
    casualties_high: Optional[int] = None
    casualties_best: Optional[int] = None
    primary_region: Optional[str] = None
    notes: Optional[str] = None


# Pagination and filtering
class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    items: list[ConflictListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class ConflictFilters(BaseModel):
    """Filter options for conflict queries."""
    year_start: Optional[int] = Field(None, ge=1000, le=2100)
    year_end: Optional[int] = Field(None, ge=1000, le=2100)
    conflict_types: Optional[list[ConflictType]] = None
    min_casualties: Optional[int] = Field(None, ge=0)
    max_casualties: Optional[int] = None
    region: Optional[str] = None
    search: Optional[str] = None
    bbox: Optional[tuple[float, float, float, float]] = None  # (min_lon, min_lat, max_lon, max_lat)


# Stats schemas
class StatsSummary(BaseModel):
    """Overall statistics."""
    total_conflicts: int
    total_casualties_low: int
    total_casualties_high: int
    total_casualties_best: int
    earliest_year: Optional[int] = None
    latest_year: Optional[int] = None
    by_type: dict[str, int]
    by_century: dict[str, int]


class TimelinePoint(BaseModel):
    """Point on the timeline."""
    year: int
    count: int
    casualties: int
    conflicts: list[ConflictListItem]


# GeoJSON schemas
class GeoJSONFeature(BaseModel):
    """GeoJSON Feature for map display."""
    type: str = "Feature"
    geometry: dict
    properties: dict


class GeoJSONCollection(BaseModel):
    """GeoJSON FeatureCollection."""
    type: str = "FeatureCollection"
    features: list[GeoJSONFeature]
