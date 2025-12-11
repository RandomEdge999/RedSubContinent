"""
Business logic for conflict data operations.
"""

from typing import Optional
from uuid import UUID

from geoalchemy2.functions import ST_AsGeoJSON, ST_X, ST_Y
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, joinedload

from ..models import Conflict, ConflictLocation
from ..schemas import (
    ConflictDetail,
    ConflictFilters,
    ConflictListItem,
    GeoJSONCollection,
    GeoJSONFeature,
    LocationSchema,
    PaginatedResponse,
    StatsSummary,
    TimelinePoint,
)


class ConflictService:
    """Service for conflict CRUD and query operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_conflicts(
        self,
        filters: Optional[ConflictFilters] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> PaginatedResponse:
        """
        Get paginated list of conflicts with optional filters.
        """
        query = select(Conflict).options(
            joinedload(Conflict.locations)
        )
        
        # Apply filters
        if filters:
            conditions = []
            
            if filters.year_start:
                conditions.append(
                    or_(
                        Conflict.start_date >= f"{filters.year_start}-01-01",
                        Conflict.end_date >= f"{filters.year_start}-01-01",
                    )
                )
            
            if filters.year_end:
                conditions.append(
                    or_(
                        Conflict.start_date <= f"{filters.year_end}-12-31",
                        Conflict.end_date <= f"{filters.year_end}-12-31",
                    )
                )
            
            if filters.conflict_types:
                conditions.append(
                    Conflict.conflict_type.in_([t.value for t in filters.conflict_types])
                )
            
            if filters.min_casualties:
                conditions.append(Conflict.casualties_best >= filters.min_casualties)
            
            if filters.max_casualties:
                conditions.append(Conflict.casualties_best <= filters.max_casualties)
            
            if filters.region:
                conditions.append(
                    Conflict.primary_region.ilike(f"%{filters.region}%")
                )
            
            if filters.search:
                search_term = f"%{filters.search}%"
                conditions.append(
                    or_(
                        Conflict.title.ilike(search_term),
                        Conflict.description_short.ilike(search_term),
                        Conflict.primary_region.ilike(search_term),
                    )
                )
            
            if conditions:
                query = query.where(and_(*conditions))
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = self.db.scalar(count_query) or 0
        
        # Order by date (newest first for conflicts without dates at end)
        query = query.order_by(
            Conflict.start_date.desc().nulls_last(),
            Conflict.casualties_best.desc().nulls_last(),
        )
        
        # Paginate
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        
        # Execute
        results = self.db.scalars(query).unique().all()
        
        # Convert to response models
        items = []
        for conflict in results:
            primary_loc = next(
                (loc for loc in conflict.locations if loc.is_primary),
                conflict.locations[0] if conflict.locations else None
            )
            
            items.append(ConflictListItem(
                id=conflict.id,
                slug=conflict.slug,
                title=conflict.title,
                conflict_type=conflict.conflict_type,
                conflict_scale=conflict.conflict_scale,
                start_date=conflict.start_date,
                end_date=conflict.end_date,
                casualties_best=conflict.casualties_best,
                primary_region=conflict.primary_region,
                primary_location=self._location_to_schema(primary_loc) if primary_loc else None,
            ))
        
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size,
        )
    
    def get_conflict_by_id(self, conflict_id: UUID) -> Optional[ConflictDetail]:
        """Get a single conflict by ID with all related data."""
        query = (
            select(Conflict)
            .options(
                joinedload(Conflict.locations),
                joinedload(Conflict.actors),
                joinedload(Conflict.sources),
            )
            .where(Conflict.id == conflict_id)
        )
        
        conflict = self.db.scalar(query)
        if not conflict:
            return None
        
        return self._conflict_to_detail(conflict)
    
    def get_conflict_by_slug(self, slug: str) -> Optional[ConflictDetail]:
        """Get a single conflict by slug with all related data."""
        query = (
            select(Conflict)
            .options(
                joinedload(Conflict.locations),
                joinedload(Conflict.actors),
                joinedload(Conflict.sources),
            )
            .where(Conflict.slug == slug)
        )
        
        conflict = self.db.scalar(query)
        if not conflict:
            return None
        
        return self._conflict_to_detail(conflict)
    
    def get_stats_summary(self) -> StatsSummary:
        """Get overall statistics about the conflict dataset."""
        # Total counts
        total = self.db.scalar(select(func.count(Conflict.id))) or 0
        
        casualties_low = self.db.scalar(
            select(func.sum(Conflict.casualties_low))
        ) or 0
        casualties_high = self.db.scalar(
            select(func.sum(Conflict.casualties_high))
        ) or 0
        casualties_best = self.db.scalar(
            select(func.sum(Conflict.casualties_best))
        ) or 0
        
        # Date range
        earliest = self.db.scalar(select(func.min(Conflict.start_date)))
        latest = self.db.scalar(select(func.max(Conflict.end_date)))
        
        # By type
        type_counts = self.db.execute(
            select(Conflict.conflict_type, func.count(Conflict.id))
            .group_by(Conflict.conflict_type)
        ).all()
        by_type = {str(t): c for t, c in type_counts}
        
        # By century
        century_query = select(
            func.floor(func.extract("year", Conflict.start_date) / 100) * 100,
            func.count(Conflict.id),
        ).where(
            Conflict.start_date.is_not(None)
        ).group_by(
            func.floor(func.extract("year", Conflict.start_date) / 100)
        )
        century_counts = self.db.execute(century_query).all()
        by_century = {f"{int(c)}s": count for c, count in century_counts if c}
        
        return StatsSummary(
            total_conflicts=total,
            total_casualties_low=casualties_low,
            total_casualties_high=casualties_high,
            total_casualties_best=casualties_best,
            earliest_year=earliest.year if earliest else None,
            latest_year=latest.year if latest else None,
            by_type=by_type,
            by_century=by_century,
        )
    
    def get_timeline(
        self,
        year_start: int = 1000,
        year_end: int = 2024,
        granularity: str = "decade",
    ) -> list[TimelinePoint]:
        """Get timeline data for visualization."""
        # Determine grouping
        if granularity == "century":
            divisor = 100
        elif granularity == "decade":
            divisor = 10
        else:
            divisor = 1
        
        query = select(
            func.floor(func.extract("year", Conflict.start_date) / divisor) * divisor,
            func.count(Conflict.id),
            func.sum(Conflict.casualties_best),
        ).where(
            and_(
                Conflict.start_date.is_not(None),
                func.extract("year", Conflict.start_date) >= year_start,
                func.extract("year", Conflict.start_date) <= year_end,
            )
        ).group_by(
            func.floor(func.extract("year", Conflict.start_date) / divisor)
        ).order_by(
            func.floor(func.extract("year", Conflict.start_date) / divisor)
        )
        
        results = self.db.execute(query).all()
        
        timeline = []
        for year, count, casualties in results:
            if year:
                timeline.append(TimelinePoint(
                    year=int(year),
                    count=count or 0,
                    casualties=casualties or 0,
                    conflicts=[],  # Would need another query for details
                ))
        
        return timeline
    
    def get_geojson(
        self,
        filters: Optional[ConflictFilters] = None,
    ) -> GeoJSONCollection:
        """Get conflicts as GeoJSON for map display."""
        query = select(
            Conflict.id,
            Conflict.slug,
            Conflict.title,
            Conflict.conflict_type,
            Conflict.start_date,
            Conflict.end_date,
            Conflict.casualties_best,
            ConflictLocation.location_name,
            ST_X(ConflictLocation.geo).label("lon"),
            ST_Y(ConflictLocation.geo).label("lat"),
        ).join(
            ConflictLocation,
            Conflict.id == ConflictLocation.conflict_id,
        ).where(
            ConflictLocation.geo.is_not(None)
        )
        
        # Apply filters if provided
        if filters and filters.year_start:
            query = query.where(
                func.extract("year", Conflict.start_date) >= filters.year_start
            )
        if filters and filters.year_end:
            query = query.where(
                func.extract("year", Conflict.start_date) <= filters.year_end
            )
        
        results = self.db.execute(query).all()
        
        features = []
        for row in results:
            if row.lat and row.lon:
                features.append(GeoJSONFeature(
                    type="Feature",
                    geometry={
                        "type": "Point",
                        "coordinates": [row.lon, row.lat],
                    },
                    properties={
                        "id": str(row.id),
                        "slug": row.slug,
                        "title": row.title,
                        "conflict_type": row.conflict_type.value if row.conflict_type else None,
                        "start_date": row.start_date.isoformat() if row.start_date else None,
                        "end_date": row.end_date.isoformat() if row.end_date else None,
                        "casualties": row.casualties_best,
                        "location_name": row.location_name,
                    },
                ))
        
        return GeoJSONCollection(features=features)
    
    def _location_to_schema(self, loc: ConflictLocation) -> LocationSchema:
        """Convert location model to schema with coordinates."""
        lat, lon = None, None
        
        if loc.geo:
            # Extract coordinates from PostGIS geometry
            try:
                coords = self.db.scalar(
                    select(ST_AsGeoJSON(loc.geo))
                )
                if coords:
                    import json
                    geom = json.loads(coords)
                    if geom.get("type") == "Point":
                        lon, lat = geom["coordinates"]
            except Exception:
                pass
        
        return LocationSchema(
            id=loc.id,
            name=loc.location_name,
            location_type=loc.location_type,
            latitude=lat,
            longitude=lon,
            is_primary=loc.is_primary,
        )
    
    def _conflict_to_detail(self, conflict: Conflict) -> ConflictDetail:
        """Convert conflict model to detailed schema."""
        from ..schemas import ActorSchema, SourceSchema
        
        return ConflictDetail(
            id=conflict.id,
            slug=conflict.slug,
            title=conflict.title,
            conflict_type=conflict.conflict_type,
            conflict_scale=conflict.conflict_scale,
            description_short=conflict.description_short,
            description_long=conflict.description_long,
            start_date=conflict.start_date,
            end_date=conflict.end_date,
            date_precision=conflict.date_precision,
            casualties_low=conflict.casualties_low,
            casualties_high=conflict.casualties_high,
            casualties_best=conflict.casualties_best,
            casualties_includes_injuries=conflict.casualties_includes_injuries,
            primary_region=conflict.primary_region,
            content_warning=conflict.content_warning,
            notes=conflict.notes,
            uncertainty_notes=conflict.uncertainty_notes,
            locations=[self._location_to_schema(loc) for loc in conflict.locations],
            actors=[
                ActorSchema(
                    id=a.id,
                    name=a.actor_name,
                    role=a.actor_role,
                    casualties=a.casualties_for_actor,
                    notes=a.notes,
                )
                for a in conflict.actors
            ],
            sources=[
                SourceSchema(
                    id=s.id,
                    source_type=s.source_type,
                    title=s.source_title,
                    url=s.source_url,
                    citation_text=s.citation_text,
                    accessed_date=s.accessed_date,
                )
                for s in conflict.sources
            ],
            created_at=conflict.created_at,
            updated_at=conflict.updated_at,
        )
