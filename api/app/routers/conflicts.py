"""
API router for conflict endpoints.
"""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, text
from sqlalchemy.orm import Session

from ..database import get_db

router = APIRouter(prefix="/conflicts", tags=["conflicts"])


@router.get("")
def list_conflicts(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=500, description="Items per page"),
    year_start: Optional[int] = Query(None, ge=1000, le=2100),
    year_end: Optional[int] = Query(None, ge=1000, le=2100),
    conflict_type: Optional[list[str]] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """List all conflicts with optional filtering and pagination."""
    
    # Build base query
    conditions = ["1=1"]
    params: dict[str, Any] = {}
    
    if year_start:
        conditions.append("EXTRACT(YEAR FROM start_date) >= :year_start")
        params["year_start"] = year_start
    
    if year_end:
        conditions.append("EXTRACT(YEAR FROM start_date) <= :year_end")
        params["year_end"] = year_end
    
    if conflict_type:
        conditions.append("conflict_type = ANY(:types)")
        params["types"] = conflict_type
    
    if search:
        conditions.append("(title ILIKE :search OR primary_region ILIKE :search)")
        params["search"] = f"%{search}%"
    
    where_clause = " AND ".join(conditions)
    
    # Get total count
    count_sql = text(f"SELECT COUNT(*) FROM conflicts WHERE {where_clause}")
    total = db.execute(count_sql, params).scalar() or 0
    
    # Get paginated results
    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset
    
    sql = text(f"""
        SELECT id, slug, title, conflict_type, start_date, end_date, 
               casualties_best, primary_region
        FROM conflicts 
        WHERE {where_clause}
        ORDER BY start_date DESC NULLS LAST
        LIMIT :limit OFFSET :offset
    """)
    
    rows = db.execute(sql, params).fetchall()
    
    items = [
        {
            "id": str(row.id),
            "slug": row.slug,
            "title": row.title,
            "conflict_type": row.conflict_type,
            "start_date": row.start_date.isoformat() if row.start_date else None,
            "end_date": row.end_date.isoformat() if row.end_date else None,
            "casualties_best": row.casualties_best,
            "primary_region": row.primary_region,
        }
        for row in rows
    ]
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
    }


@router.get("/geojson")
def get_conflicts_geojson(
    year_start: Optional[int] = Query(None, ge=1000, le=2100),
    year_end: Optional[int] = Query(None, ge=1000, le=2100),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Get conflicts as GeoJSON for map display."""
    # For now, return conflicts with their primary_region as label
    # (geocoding would add actual lat/lng coordinates)
    
    conditions = ["1=1"]
    params: dict[str, Any] = {}
    
    if year_start:
        conditions.append("EXTRACT(YEAR FROM start_date) >= :year_start")
        params["year_start"] = year_start
    
    if year_end:
        conditions.append("EXTRACT(YEAR FROM start_date) <= :year_end")
        params["year_end"] = year_end
    
    where_clause = " AND ".join(conditions)
    
    # Get conflicts with locations from conflict_locations
    sql = text(f"""
        SELECT c.id, c.slug, c.title, c.conflict_type, c.casualties_best,
               c.start_date, c.primary_region,
               ST_X(l.geo) as lon, ST_Y(l.geo) as lat
        FROM conflicts c
        LEFT JOIN conflict_locations l ON c.id = l.conflict_id
        WHERE {where_clause}
        LIMIT 500
    """)
    
    rows = db.execute(sql, params).fetchall()
    
    # Create a location lookup for South Asian cities
    DEFAULT_LOCATIONS = {
        "india": [78.9629, 20.5937],
        "pakistan": [69.3451, 30.3753],
        "bangladesh": [90.3563, 23.685],
        "afghanistan": [67.7100, 33.9391],
        "kashmir": [74.7973, 34.0837],
        "punjab": [75.3412, 31.1471],
        "bengal": [87.8550, 22.9868],
        "delhi": [77.1025, 28.7041],
        "mumbai": [72.8777, 19.0760],
        "karachi": [67.0011, 24.8607],
        "dhaka": [90.4125, 23.8103],
        "kabul": [69.1723, 34.5553],
        "lahore": [74.3587, 31.5204],
        "kolkata": [88.3639, 22.5726],
        "hyderabad": [78.4867, 17.3850],
        "tamil nadu": [78.6569, 11.1271],
        "gujarat": [71.1924, 22.2587],
        "rajasthan": [74.2179, 27.0238],
        "maharashtra": [75.7139, 19.7515],
        "myanmar": [95.9560, 21.9162],
        "sri lanka": [80.7718, 7.8731],
    }
    
    features = []
    for row in rows:
        # Use database coordinates or fallback to region lookup
        lon, lat = row.lon, row.lat
        
        if not lon or not lat:
            region_lower = (row.primary_region or "india").lower()
            for key, coords in DEFAULT_LOCATIONS.items():
                if key in region_lower:
                    lon, lat = coords
                    # Add small random offset for multiple conflicts at same location
                    import random
                    lon += random.uniform(-2, 2)
                    lat += random.uniform(-2, 2)
                    break
            else:
                lon, lat = DEFAULT_LOCATIONS["india"]
                import random
                lon += random.uniform(-5, 5)
                lat += random.uniform(-5, 5)
        
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat],
            },
            "properties": {
                "id": str(row.id),
                "slug": row.slug,
                "title": row.title,
                "conflict_type": row.conflict_type,
                "casualties": row.casualties_best,
                "start_date": row.start_date.isoformat() if row.start_date else None,
            },
        })
    
    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/timeline")
def get_conflicts_timeline(
    year_start: int = Query(1000, ge=1000, le=2100),
    year_end: int = Query(2024, ge=1000, le=2100),
    granularity: str = Query("decade"),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Get aggregated timeline data for visualization."""
    
    if granularity == "century":
        divisor = 100
    elif granularity == "decade":
        divisor = 10
    else:
        divisor = 1
    
    sql = text(f"""
        SELECT 
            (FLOOR(EXTRACT(YEAR FROM start_date) / {divisor}) * {divisor})::int AS period,
            COUNT(*) as count,
            COALESCE(SUM(casualties_best), 0) as casualties
        FROM conflicts
        WHERE start_date IS NOT NULL
          AND EXTRACT(YEAR FROM start_date) >= :year_start
          AND EXTRACT(YEAR FROM start_date) <= :year_end
        GROUP BY period
        ORDER BY period
    """)
    
    rows = db.execute(sql, {"year_start": year_start, "year_end": year_end}).fetchall()
    
    return [
        {"year": row.period, "count": row.count, "casualties": int(row.casualties)}
        for row in rows
        if row.period is not None
    ]


@router.get("/{conflict_id}")
def get_conflict(
    conflict_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Get a single conflict by ID."""
    
    sql = text("""
        SELECT id, slug, title, conflict_type, start_date, end_date,
               casualties_low, casualties_high, casualties_best,
               primary_region, notes, description_short
        FROM conflicts
        WHERE id = :id
    """)
    
    row = db.execute(sql, {"id": conflict_id}).fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Conflict not found")
    
    return {
        "id": str(row.id),
        "slug": row.slug,
        "title": row.title,
        "conflict_type": row.conflict_type,
        "start_date": row.start_date.isoformat() if row.start_date else None,
        "end_date": row.end_date.isoformat() if row.end_date else None,
        "casualties_low": row.casualties_low,
        "casualties_high": row.casualties_high,
        "casualties_best": row.casualties_best,
        "primary_region": row.primary_region,
        "notes": row.notes,
        "description": row.description_short,
        "locations": [],
        "actors": [],
        "sources": [],
    }


@router.get("/by-slug/{slug}")
def get_conflict_by_slug(
    slug: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Get a single conflict by slug."""
    
    sql = text("""
        SELECT id, slug, title, conflict_type, start_date, end_date,
               casualties_low, casualties_high, casualties_best,
               primary_region, notes, description_short
        FROM conflicts
        WHERE slug = :slug
    """)
    
    row = db.execute(sql, {"slug": slug}).fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Conflict not found")
    
    return {
        "id": str(row.id),
        "slug": row.slug,
        "title": row.title,
        "conflict_type": row.conflict_type,
        "start_date": row.start_date.isoformat() if row.start_date else None,
        "end_date": row.end_date.isoformat() if row.end_date else None,
        "casualties_low": row.casualties_low,
        "casualties_high": row.casualties_high,
        "casualties_best": row.casualties_best,
        "primary_region": row.primary_region,
        "description": row.description_short,
        "locations": [],
        "actors": [],
        "sources": [],
    }
