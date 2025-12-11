"""
API router for stats endpoints.
"""

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary")
def get_stats_summary(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Get overall statistics about the conflict dataset."""
    
    # Total count
    total = db.execute(text("SELECT COUNT(*) FROM conflicts")).scalar() or 0
    
    # Casualties totals  
    casualties = db.execute(text("""
        SELECT 
            COALESCE(SUM(casualties_low), 0) as low,
            COALESCE(SUM(casualties_high), 0) as high,
            COALESCE(SUM(casualties_best), 0) as best
        FROM conflicts
    """)).fetchone()
    
    # Date range
    dates = db.execute(text("""
        SELECT 
            MIN(EXTRACT(YEAR FROM start_date))::int as earliest,
            MAX(EXTRACT(YEAR FROM end_date))::int as latest
        FROM conflicts
        WHERE start_date IS NOT NULL
    """)).fetchone()
    
    # By type
    type_counts = db.execute(text("""
        SELECT conflict_type, COUNT(*) as count
        FROM conflicts
        GROUP BY conflict_type
        ORDER BY count DESC
    """)).fetchall()
    by_type = {row.conflict_type: row.count for row in type_counts if row.conflict_type}
    
    # By century
    century_counts = db.execute(text("""
        SELECT 
            (FLOOR(EXTRACT(YEAR FROM start_date) / 100) * 100)::int as century,
            COUNT(*) as count
        FROM conflicts
        WHERE start_date IS NOT NULL
        GROUP BY century
        ORDER BY century
    """)).fetchall()
    by_century = {f"{row.century}s": row.count for row in century_counts if row.century}
    
    return {
        "total_conflicts": total,
        "total_casualties_low": int(casualties.low) if casualties else 0,
        "total_casualties_high": int(casualties.high) if casualties else 0,
        "total_casualties_best": int(casualties.best) if casualties else 0,
        "earliest_year": dates.earliest if dates else 1000,
        "latest_year": dates.latest if dates else 2024,
        "by_type": by_type,
        "by_century": by_century,
    }


@router.get("/by-region")
def get_stats_by_region(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get statistics grouped by region."""
    
    sql = text("""
        SELECT 
            primary_region as region,
            COUNT(*) as conflict_count,
            COALESCE(SUM(casualties_best), 0) as total_casualties
        FROM conflicts
        WHERE primary_region IS NOT NULL AND primary_region != ''
        GROUP BY primary_region
        ORDER BY conflict_count DESC
        LIMIT :limit
    """)
    
    rows = db.execute(sql, {"limit": limit}).fetchall()
    
    return [
        {
            "region": row.region,
            "conflict_count": row.conflict_count,
            "total_casualties": int(row.total_casualties),
        }
        for row in rows
    ]


@router.get("/by-decade")
def get_stats_by_decade(
    century: int = Query(1900, ge=1000, le=2000),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get statistics by decade for a specific century."""
    
    start_year = century
    end_year = century + 99
    
    sql = text("""
        SELECT 
            (FLOOR(EXTRACT(YEAR FROM start_date) / 10) * 10)::int as decade,
            COUNT(*) as conflict_count,
            COALESCE(SUM(casualties_best), 0) as total_casualties
        FROM conflicts
        WHERE start_date IS NOT NULL
          AND EXTRACT(YEAR FROM start_date) >= :start_year
          AND EXTRACT(YEAR FROM start_date) <= :end_year
        GROUP BY decade
        ORDER BY decade
    """)
    
    rows = db.execute(sql, {"start_year": start_year, "end_year": end_year}).fetchall()
    
    return [
        {
            "decade": row.decade,
            "conflict_count": row.conflict_count,
            "total_casualties": int(row.total_casualties),
        }
        for row in rows
    ]
