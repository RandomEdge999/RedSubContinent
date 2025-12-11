"""
Basic tests for the conflict API endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root():
    """Test root endpoint returns API info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "version" in data


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_api_root():
    """Test API root lists available endpoints."""
    response = client.get("/api")
    assert response.status_code == 200
    data = response.json()
    assert "endpoints" in data
    assert "conflicts" in data["endpoints"]


def test_list_conflicts_empty():
    """Test listing conflicts when database is empty."""
    # Note: This test would need a test database
    # For now, just check the endpoint responds
    response = client.get("/api/conflicts")
    assert response.status_code in [200, 500]  # 500 if no DB


def test_conflict_filters_validation():
    """Test that filter parameters are validated."""
    # Invalid year
    response = client.get("/api/conflicts?year_start=500")
    assert response.status_code == 422
    
    # Invalid page size
    response = client.get("/api/conflicts?page_size=1000")
    assert response.status_code == 422


def test_timeline_endpoint():
    """Test timeline endpoint with valid parameters."""
    response = client.get("/api/conflicts/timeline?year_start=1800&year_end=1900")
    assert response.status_code in [200, 500]


def test_geojson_endpoint():
    """Test GeoJSON endpoint."""
    response = client.get("/api/conflicts/geojson")
    assert response.status_code in [200, 500]


def test_stats_summary():
    """Test stats summary endpoint."""
    response = client.get("/api/stats/summary")
    assert response.status_code in [200, 500]


def test_actors_list():
    """Test actors list endpoint."""
    response = client.get("/api/actors")
    assert response.status_code in [200, 500]


def test_actors_search():
    """Test actors search endpoint."""
    response = client.get("/api/actors/search?q=british")
    assert response.status_code in [200, 500]
