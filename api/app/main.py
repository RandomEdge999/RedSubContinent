"""
Red SubContinent API - FastAPI Application

Main entry point for the API server.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import json
import time
import uuid

from .config import get_settings
from .routers import actors_router, conflicts_router, stats_router

settings = get_settings()

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=0.2,
        integrations=[FastApiIntegration(), LoggingIntegration(level=None, event_level=None)],
        environment=settings.sentry_environment,
        release=settings.sentry_release,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("Red SubContinent API starting up...")
    yield
    # Shutdown
    print("Red SubContinent API shutting down...")


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

RATE_LIMIT_MAX = 120  # requests per minute per client
rate_bucket: dict[str, list[float]] = {}


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Simple in-memory rate limiter with basic request logging."""
    import time

    client = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - 60

    bucket = rate_bucket.get(client, [])
    bucket = [ts for ts in bucket if ts >= window_start]

    if len(bucket) >= RATE_LIMIT_MAX:
        return JSONResponse({"detail": "Rate limit exceeded"}, status_code=429)

    bucket.append(now)
    rate_bucket[client] = bucket

    try:
        response = await call_next(request)
    except Exception as exc:  # pragma: no cover - defensive logging
        print(f"API error on {request.url.path}: {exc}")
        raise

    return response


@app.middleware("http")
async def structured_logging_middleware(request: Request, call_next):
    """Log request/response metadata as JSON to stdout for Promtail/Loki."""
    start = time.time()
    req_id = str(uuid.uuid4())
    try:
        response = await call_next(request)
    except Exception as exc:
        duration = (time.time() - start) * 1000
        log_line = {
            "req_id": req_id,
            "path": request.url.path,
            "method": request.method,
            "status": 500,
            "duration_ms": duration,
            "ip": request.client.host if request.client else "unknown",
            "ua": request.headers.get("user-agent"),
            "error": str(exc),
            "source": "api",
        }
        print(json.dumps(log_line))
        raise

    duration = (time.time() - start) * 1000
    log_line = {
        "req_id": req_id,
        "path": request.url.path,
        "method": request.method,
        "status": response.status_code,
        "duration_ms": duration,
        "ip": request.client.host if request.client else "unknown",
        "ua": request.headers.get("user-agent"),
        "source": "api",
    }
    print(json.dumps(log_line))
    return response

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
    """Health check endpoint with DB connectivity."""
    from .database import SessionLocal
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return {"status": "healthy", "db": "ok"}
    except Exception as exc:
        return {"status": "degraded", "db": f"error: {exc}"}


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
