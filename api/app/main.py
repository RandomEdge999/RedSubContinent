"""
Red SubContinent API - FastAPI Application

Main entry point for the API server.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import actors_router, conflicts_router, stats_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 Red SubContinent API starting up...")
    yield
    # Shutdown
    print("👋 Red SubContinent API shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(conflicts_router, prefix="/api")
app.include_router(stats_router, prefix="/api")
app.include_router(actors_router, prefix="/api")


@app.get("/")
def root():
    """Root endpoint with API info."""
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "description": settings.api_description,
        "documentation": "/docs",
    }


@app.get("/health")
def health_check():
    """Health check endpoint for container orchestration."""
    return {"status": "healthy"}


@app.get("/api")
def api_root():
    """API root with available endpoints."""
    return {
        "endpoints": {
            "conflicts": "/api/conflicts",
            "conflicts_geojson": "/api/conflicts/geojson",
            "conflicts_timeline": "/api/conflicts/timeline",
            "stats_summary": "/api/stats/summary",
            "stats_by_region": "/api/stats/by-region",
            "stats_by_decade": "/api/stats/by-decade",
            "actors": "/api/actors",
        }
    }
