"""
Geocoding utilities for converting place names to coordinates.

Uses Nominatim (OpenStreetMap) for geocoding with caching
to minimize API calls and respect rate limits.
"""

import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

logger = logging.getLogger(__name__)


@dataclass
class GeocodingResult:
    """Result of a geocoding lookup."""
    
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    display_name: Optional[str] = None
    location_type: Optional[str] = None
    source: str = "nominatim"
    original_query: str = ""
    
    @property
    def is_valid(self) -> bool:
        """Check if coordinates were found."""
        return self.latitude is not None and self.longitude is not None


# Cache of known historical locations that may not geocode well
# Format: {name: (lat, lon, display_name)}
HISTORICAL_GAZETTEER = {
    # Major historical cities
    "delhi": (28.6139, 77.2090, "Delhi, India"),
    "agra": (27.1767, 78.0081, "Agra, India"),
    "lahore": (31.5497, 74.3436, "Lahore, Pakistan"),
    "dhaka": (23.8103, 90.4125, "Dhaka, Bangladesh"),
    "kabul": (34.5553, 69.2075, "Kabul, Afghanistan"),
    "mumbai": (19.0760, 72.8777, "Mumbai, India"),
    "bombay": (19.0760, 72.8777, "Bombay (Mumbai), India"),
    "calcutta": (22.5726, 88.3639, "Calcutta (Kolkata), India"),
    "kolkata": (22.5726, 88.3639, "Kolkata, India"),
    "madras": (13.0827, 80.2707, "Madras (Chennai), India"),
    "chennai": (13.0827, 80.2707, "Chennai, India"),
    "hyderabad": (17.3850, 78.4867, "Hyderabad, India"),
    "karachi": (24.8607, 67.0011, "Karachi, Pakistan"),
    "peshawar": (34.0151, 71.5249, "Peshawar, Pakistan"),
    "amritsar": (31.6340, 74.8723, "Amritsar, India"),
    "lucknow": (26.8467, 80.9462, "Lucknow, India"),
    "jaipur": (26.9124, 75.7873, "Jaipur, India"),
    
    # Historical regions
    "punjab": (31.1471, 75.3412, "Punjab Region"),
    "bengal": (23.6850, 90.3563, "Bengal Region"),
    "deccan": (18.1124, 79.0193, "Deccan Plateau"),
    "kashmir": (33.7782, 76.5762, "Kashmir"),
    "sind": (26.0000, 68.0000, "Sindh, Pakistan"),
    "sindh": (26.0000, 68.0000, "Sindh, Pakistan"),
    "rajputana": (26.4499, 74.6399, "Rajputana (Rajasthan)"),
    "oudh": (26.8467, 80.9462, "Oudh (Awadh)"),
    "awadh": (26.8467, 80.9462, "Awadh"),
    
    # Battle sites
    "panipat": (29.3909, 76.9635, "Panipat, India"),
    "plassey": (23.8000, 88.2500, "Plassey, India"),
    "buxar": (25.5643, 83.9778, "Buxar, India"),
    "talikota": (16.4800, 76.3100, "Talikota, India"),
    "haldighati": (24.8833, 73.6833, "Haldighati, India"),
    
    # Partition-related
    "radcliffe line": (31.0000, 74.0000, "Radcliffe Line (India-Pakistan border)"),
    "wagah": (31.6047, 74.5725, "Wagah Border"),
}


class GeocodeCache:
    """
    Persistent cache for geocoding results.
    
    Stores results to avoid repeated API calls for the same locations.
    """
    
    def __init__(self, cache_file: Optional[Path] = None):
        self.cache_file = cache_file or Path("data/processed/geocode_cache.json")
        self._cache: dict[str, dict] = {}
        self._load_cache()
    
    def _load_cache(self) -> None:
        """Load cache from disk if available."""
        if self.cache_file.exists():
            try:
                self._cache = json.loads(self.cache_file.read_text(encoding="utf-8"))
                logger.info(f"Loaded {len(self._cache)} cached geocoding results")
            except Exception as e:
                logger.warning(f"Failed to load geocode cache: {e}")
                self._cache = {}
    
    def _save_cache(self) -> None:
        """Persist cache to disk."""
        try:
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            self.cache_file.write_text(
                json.dumps(self._cache, indent=2),
                encoding="utf-8"
            )
        except Exception as e:
            logger.warning(f"Failed to save geocode cache: {e}")
    
    def get(self, query: str) -> Optional[GeocodingResult]:
        """Get cached result for a query."""
        normalized = query.lower().strip()
        if normalized in self._cache:
            data = self._cache[normalized]
            return GeocodingResult(
                latitude=data.get("lat"),
                longitude=data.get("lon"),
                display_name=data.get("display_name"),
                location_type=data.get("type"),
                source=data.get("source", "cache"),
                original_query=query,
            )
        return None
    
    def set(self, query: str, result: GeocodingResult) -> None:
        """Cache a geocoding result."""
        normalized = query.lower().strip()
        self._cache[normalized] = {
            "lat": result.latitude,
            "lon": result.longitude,
            "display_name": result.display_name,
            "type": result.location_type,
            "source": result.source,
        }
        self._save_cache()


class Geocoder:
    """
    Geocoder with caching, historical gazetteer, and South Asia focus.
    
    Prioritizes:
    1. Historical gazetteer for known places
    2. Local cache of previous lookups
    3. Nominatim API (with rate limiting)
    """
    
    def __init__(
        self,
        cache_dir: Optional[Path] = None,
        rate_limit_seconds: float = 1.0,
    ):
        self._cache = GeocodeCache(
            cache_file=cache_dir / "geocode_cache.json" if cache_dir else None
        )
        self._rate_limit = rate_limit_seconds
        self._last_request_time: float = 0
        
        # Initialize Nominatim with a custom user agent
        self._geolocator = Nominatim(
            user_agent="RedSubContinent-Geocoder/0.1"
        )
    
    def geocode(
        self,
        query: str,
        bias_to_south_asia: bool = True,
    ) -> GeocodingResult:
        """
        Geocode a place name to coordinates.
        
        Args:
            query: Place name to geocode
            bias_to_south_asia: If True, prefer results in South Asia
            
        Returns:
            GeocodingResult with coordinates if found
        """
        if not query:
            return GeocodingResult(original_query=query)
        
        query_clean = query.strip()
        query_lower = query_clean.lower()
        
        # 1. Check historical gazetteer first
        if query_lower in HISTORICAL_GAZETTEER:
            lat, lon, display = HISTORICAL_GAZETTEER[query_lower]
            return GeocodingResult(
                latitude=lat,
                longitude=lon,
                display_name=display,
                source="gazetteer",
                original_query=query,
            )
        
        # 2. Check cache
        cached = self._cache.get(query_clean)
        if cached:
            cached.original_query = query
            return cached
        
        # 3. Try Nominatim API
        result = self._nominatim_geocode(query_clean, bias_to_south_asia)
        
        # Cache the result (even if not found, to avoid repeated lookups)
        self._cache.set(query_clean, result)
        
        return result
    
    def _nominatim_geocode(
        self,
        query: str,
        bias_to_south_asia: bool,
    ) -> GeocodingResult:
        """Query Nominatim API with rate limiting."""
        
        # Rate limiting
        elapsed = time.time() - self._last_request_time
        if elapsed < self._rate_limit:
            time.sleep(self._rate_limit - elapsed)
        
        self._last_request_time = time.time()
        
        try:
            # Add South Asia context if biasing
            search_query = query
            if bias_to_south_asia and "india" not in query.lower():
                # Try with South Asia countries as context
                for country in ["India", "Pakistan", "Bangladesh", "Afghanistan"]:
                    result = self._try_geocode(f"{query}, {country}")
                    if result.is_valid:
                        return result
            
            # Try original query
            return self._try_geocode(search_query)
            
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.warning(f"Geocoding error for '{query}': {e}")
            return GeocodingResult(original_query=query)
    
    def _try_geocode(self, query: str) -> GeocodingResult:
        """Attempt a single geocode lookup."""
        try:
            location = self._geolocator.geocode(query)
            if location:
                return GeocodingResult(
                    latitude=location.latitude,
                    longitude=location.longitude,
                    display_name=location.address,
                    source="nominatim",
                    original_query=query,
                )
        except Exception as e:
            logger.debug(f"Geocode attempt failed for '{query}': {e}")
        
        return GeocodingResult(original_query=query)
    
    def geocode_batch(
        self,
        queries: list[str],
        bias_to_south_asia: bool = True,
    ) -> list[GeocodingResult]:
        """
        Geocode multiple place names.
        
        Args:
            queries: List of place names
            bias_to_south_asia: If True, prefer South Asian results
            
        Returns:
            List of GeocodingResults in same order as queries
        """
        from tqdm import tqdm
        
        results = []
        for query in tqdm(queries, desc="Geocoding"):
            result = self.geocode(query, bias_to_south_asia)
            results.append(result)
        
        return results


# Module-level geocoder instance
_geocoder: Optional[Geocoder] = None


def get_geocoder(cache_dir: Optional[Path] = None) -> Geocoder:
    """Get or create the module-level geocoder instance."""
    global _geocoder
    if _geocoder is None:
        _geocoder = Geocoder(cache_dir=cache_dir)
    return _geocoder


def geocode_location(query: str) -> GeocodingResult:
    """
    Convenience function to geocode a single location.
    
    Uses the module-level geocoder instance with caching.
    """
    return get_geocoder().geocode(query)
