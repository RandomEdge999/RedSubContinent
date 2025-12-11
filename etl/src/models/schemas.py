"""
Pydantic models for data validation in the ETL pipeline.

These models enforce the schema for conflict data at each stage:
- Raw: Data as scraped from sources
- Cleaned: Normalized and validated data ready for database
"""

from datetime import date
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator, model_validator


class ConflictType(str, Enum):
    """Categories of historical conflicts and violent events."""
    
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
    """Geographic scale of the conflict."""
    
    LOCAL = "local"
    REGIONAL = "regional"
    SUBCONTINENTAL = "subcontinental"
    INTERNATIONAL = "international"


class ActorRole(str, Enum):
    """Role of an actor in a conflict."""
    
    AGGRESSOR = "aggressor"
    DEFENDER = "defender"
    COLONIAL_POWER = "colonial_power"
    REBEL_GROUP = "rebel_group"
    EMPIRE = "empire"
    KINGDOM = "kingdom"
    STATE = "state"
    OTHER = "other"


class SourceType(str, Enum):
    """Type of data source."""
    
    WIKIPEDIA = "wikipedia"
    BOOK = "book"
    ACADEMIC_PAPER = "academic_paper"
    DATABASE = "database"
    GOVERNMENT_RECORD = "government_record"
    OTHER = "other"


class DatePrecision(str, Enum):
    """Precision level for historical dates."""
    
    EXACT = "exact"
    MONTH = "month"
    YEAR = "year"
    DECADE = "decade"
    CENTURY = "century"


class CasualtiesRange(BaseModel):
    """
    Represents casualty estimates with uncertainty.
    
    For events where exact figures are unknown, we store low/high bounds
    and calculate a best estimate.
    """
    
    low: Optional[int] = Field(None, ge=0, description="Lower bound estimate")
    high: Optional[int] = Field(None, ge=0, description="Upper bound estimate")
    best_estimate: Optional[int] = Field(None, ge=0, description="Best single estimate")
    includes_injuries: bool = Field(False, description="Whether injuries are included")
    notes: Optional[str] = Field(None, description="Explanation of uncertainty")
    
    @model_validator(mode="after")
    def validate_range(self) -> "CasualtiesRange":
        """Ensure low <= best_estimate <= high when all are present."""
        if self.low is not None and self.high is not None:
            if self.low > self.high:
                raise ValueError("Low estimate cannot exceed high estimate")
        if self.best_estimate is not None:
            if self.low is not None and self.best_estimate < self.low:
                raise ValueError("Best estimate cannot be below low estimate")
            if self.high is not None and self.best_estimate > self.high:
                raise ValueError("Best estimate cannot exceed high estimate")
        return self
    
    def calculate_best_estimate(self) -> Optional[int]:
        """Calculate best estimate from range if not provided."""
        if self.best_estimate is not None:
            return self.best_estimate
        if self.low is not None and self.high is not None:
            # Use geometric mean for large ranges, arithmetic for small
            if self.high > self.low * 5:
                import math
                return int(math.sqrt(self.low * self.high))
            return (self.low + self.high) // 2
        return self.low or self.high


class LocationData(BaseModel):
    """Geographic location for a conflict."""
    
    name: str = Field(..., min_length=1, description="Location name")
    location_type: Optional[str] = Field(None, description="city, region, battlefield, etc.")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    is_primary: bool = Field(False, description="Primary location for the conflict")
    notes: Optional[str] = None
    
    @property
    def has_coordinates(self) -> bool:
        """Check if coordinates are available."""
        return self.latitude is not None and self.longitude is not None


class ActorData(BaseModel):
    """A participant or belligerent in a conflict."""
    
    name: str = Field(..., min_length=1, description="Actor name")
    role: ActorRole = Field(..., description="Role in the conflict")
    casualties: Optional[int] = Field(None, ge=0, description="Casualties for this actor")
    notes: Optional[str] = None


class SourceData(BaseModel):
    """A reference or citation for conflict data."""
    
    source_type: SourceType = Field(..., description="Type of source")
    title: Optional[str] = Field(None, description="Title of the source")
    url: Optional[str] = Field(None, description="URL if available")
    citation_text: Optional[str] = Field(None, description="Full citation")
    accessed_date: Optional[date] = Field(None, description="When the source was accessed")
    reliability_notes: Optional[str] = None


class ConflictRaw(BaseModel):
    """
    Raw conflict data as scraped from sources.
    
    This model is permissive and accepts messy data that will be
    cleaned in subsequent pipeline stages.
    """
    
    title: str = Field(..., min_length=1, description="Event title")
    source_url: str = Field(..., description="URL where data was scraped from")
    
    # Dates as raw strings - will be parsed later
    date_text: Optional[str] = Field(None, description="Raw date string from source")
    start_date_text: Optional[str] = None
    end_date_text: Optional[str] = None
    
    # Location as raw text
    location_text: Optional[str] = Field(None, description="Raw location string")
    
    # Casualties as raw text
    casualties_text: Optional[str] = Field(None, description="Raw casualties string")
    
    # Other fields
    description: Optional[str] = None
    belligerents_text: Optional[str] = None
    result_text: Optional[str] = None
    notes: Optional[str] = None
    
    # References from the source
    references: list[str] = Field(default_factory=list)


class ConflictCleaned(BaseModel):
    """
    Cleaned and normalized conflict data ready for database insertion.
    
    All fields are validated and in their final form.
    """
    
    id: UUID = Field(default_factory=uuid4)
    title: str = Field(..., min_length=1, max_length=500)
    slug: str = Field(..., min_length=1, max_length=500)
    
    conflict_type: ConflictType = Field(..., description="Category of conflict")
    conflict_scale: ConflictScale = Field(ConflictScale.REGIONAL)
    
    description_short: Optional[str] = Field(None, max_length=500)
    description_long: Optional[str] = None
    
    # Normalized dates
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    date_precision: DatePrecision = Field(DatePrecision.YEAR)
    
    # Normalized casualties
    casualties: CasualtiesRange = Field(default_factory=CasualtiesRange)
    
    # Geographic data
    primary_region: Optional[str] = None
    locations: list[LocationData] = Field(default_factory=list)
    
    # Actors involved
    actors: list[ActorData] = Field(default_factory=list)
    
    # Sources
    sources: list[SourceData] = Field(default_factory=list)
    
    # Metadata
    notes: Optional[str] = None
    uncertainty_notes: Optional[str] = None
    content_warning: Optional[str] = None
    
    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Ensure slug is URL-safe."""
        import re
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
            raise ValueError("Slug must be lowercase with hyphens only")
        return v
    
    @model_validator(mode="after")
    def validate_dates(self) -> "ConflictCleaned":
        """Ensure end_date is not before start_date."""
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValueError("End date cannot be before start date")
        return self
    
    @property
    def display_date_range(self) -> str:
        """Format dates for display."""
        if self.start_date and self.end_date:
            if self.start_date.year == self.end_date.year:
                return str(self.start_date.year)
            return f"{self.start_date.year}–{self.end_date.year}"
        if self.start_date:
            return str(self.start_date.year)
        return "Date unknown"
    
    @property
    def display_casualties(self) -> str:
        """Format casualties for display."""
        cas = self.casualties
        if cas.best_estimate:
            if cas.low and cas.high and cas.low != cas.high:
                return f"~{cas.best_estimate:,} ({cas.low:,}–{cas.high:,})"
            return f"{cas.best_estimate:,}"
        if cas.low and cas.high:
            return f"{cas.low:,}–{cas.high:,}"
        return "Unknown"


class ConflictBatch(BaseModel):
    """A batch of conflicts from a single source."""
    
    source_url: str
    source_name: str
    scraped_at: date
    conflicts: list[ConflictRaw] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    
    @property
    def success_count(self) -> int:
        return len(self.conflicts)
    
    @property
    def error_count(self) -> int:
        return len(self.errors)
