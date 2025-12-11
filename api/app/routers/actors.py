"""
API router for actor endpoints.
"""

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db

router = APIRouter(prefix="/actors", tags=["actors"])


@router.get("")
def list_actors(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get list of all unique actors."""
    
    sql = text("""
        SELECT actor_name as name, actor_role as role, COUNT(*) as appearance_count
        FROM conflict_actors
        GROUP BY actor_name, actor_role
        ORDER BY appearance_count DESC
        LIMIT :limit
    """)
    
    rows = db.execute(sql, {"limit": limit}).fetchall()
    
    return [
        {
            "name": row.name,
            "role": row.role,
            "appearance_count": row.appearance_count,
        }
        for row in rows
    ]


@router.get("/by-role/{role}")
def get_actors_by_role(
    role: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get actors filtered by role."""
    
    sql = text("""
        SELECT actor_name as name, COUNT(*) as appearance_count
        FROM conflict_actors
        WHERE actor_role = :role
        GROUP BY actor_name
        ORDER BY appearance_count DESC
        LIMIT :limit
    """)
    
    rows = db.execute(sql, {"role": role, "limit": limit}).fetchall()
    
    return [
        {
            "name": row.name,
            "role": role,
            "appearance_count": row.appearance_count,
        }
        for row in rows
    ]


@router.get("/search")
def search_actors(
    q: str = Query(..., min_length=2),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Search actors by name."""
    
    sql = text("""
        SELECT actor_name as name, actor_role as role, COUNT(*) as appearance_count
        FROM conflict_actors
        WHERE actor_name ILIKE :query
        GROUP BY actor_name, actor_role
        ORDER BY appearance_count DESC
        LIMIT :limit
    """)
    
    rows = db.execute(sql, {"query": f"%{q}%", "limit": limit}).fetchall()
    
    return [
        {
            "name": row.name,
            "role": row.role,
            "appearance_count": row.appearance_count,
        }
        for row in rows
    ]
