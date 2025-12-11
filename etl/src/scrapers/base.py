"""
Base scraper class and utilities for web scraping.

All scrapers should inherit from BaseScraper and implement the
abstract methods for fetching and parsing data.
"""

import logging
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class ScraperConfig(BaseModel):
    """Configuration for scrapers."""
    
    # Rate limiting
    request_delay_seconds: float = 1.0
    max_retries: int = 3
    retry_delay_seconds: float = 5.0
    
    # Timeouts
    timeout_seconds: float = 30.0
    
    # User agent - be transparent about who we are
    user_agent: str = (
        "RedSubContinent-Bot/0.1 "
        "(Historical data research project; "
        "https://github.com/redsubcontinent; "
        "respects robots.txt)"
    )
    
    # Cache settings
    cache_directory: Path = Path("data/raw")
    use_cache: bool = True


class BaseScraper(ABC):
    """
    Abstract base class for all scrapers.
    
    Provides common functionality for:
    - HTTP requests with rate limiting
    - Retry logic
    - Response caching
    - Error handling
    """
    
    def __init__(self, config: Optional[ScraperConfig] = None):
        self.config = config or ScraperConfig()
        self._client: Optional[httpx.Client] = None
        self._last_request_time: float = 0
    
    @property
    def client(self) -> httpx.Client:
        """Lazy-initialize HTTP client."""
        if self._client is None:
            self._client = httpx.Client(
                timeout=self.config.timeout_seconds,
                headers={"User-Agent": self.config.user_agent},
                follow_redirects=True,
            )
        return self._client
    
    def close(self) -> None:
        """Close the HTTP client."""
        if self._client is not None:
            self._client.close()
            self._client = None
    
    def __enter__(self) -> "BaseScraper":
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()
    
    def _rate_limit(self) -> None:
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.config.request_delay_seconds:
            sleep_time = self.config.request_delay_seconds - elapsed
            logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s")
            time.sleep(sleep_time)
    
    def _get_cache_path(self, url: str) -> Path:
        """Generate cache file path for a URL."""
        from hashlib import md5
        url_hash = md5(url.encode()).hexdigest()
        return self.config.cache_directory / f"{url_hash}.html"
    
    def _read_cache(self, url: str) -> Optional[str]:
        """Read cached response if available."""
        if not self.config.use_cache:
            return None
        
        cache_path = self._get_cache_path(url)
        if cache_path.exists():
            logger.debug(f"Cache hit: {url}")
            return cache_path.read_text(encoding="utf-8")
        return None
    
    def _write_cache(self, url: str, content: str) -> None:
        """Write response to cache."""
        if not self.config.use_cache:
            return
        
        cache_path = self._get_cache_path(url)
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache_path.write_text(content, encoding="utf-8")
        logger.debug(f"Cached: {url}")
    
    def fetch(self, url: str) -> str:
        """
        Fetch a URL with rate limiting, caching, and retries.
        
        Args:
            url: The URL to fetch
            
        Returns:
            The response body as a string
            
        Raises:
            httpx.HTTPError: If all retries fail
        """
        # Check cache first
        cached = self._read_cache(url)
        if cached is not None:
            return cached
        
        # Fetch with retries
        last_error: Optional[Exception] = None
        for attempt in range(self.config.max_retries):
            try:
                self._rate_limit()
                self._last_request_time = time.time()
                
                logger.info(f"Fetching: {url} (attempt {attempt + 1})")
                response = self.client.get(url)
                response.raise_for_status()
                
                content = response.text
                self._write_cache(url, content)
                return content
                
            except httpx.HTTPError as e:
                last_error = e
                logger.warning(f"Request failed: {e}")
                if attempt < self.config.max_retries - 1:
                    time.sleep(self.config.retry_delay_seconds)
        
        raise last_error or RuntimeError("Request failed")
    
    @abstractmethod
    def get_source_urls(self) -> list[str]:
        """Return list of URLs to scrape."""
        pass
    
    @abstractmethod
    def parse(self, html: str, url: str) -> list[dict]:
        """Parse HTML and return list of raw conflict dictionaries."""
        pass
    
    def run(self) -> list[dict]:
        """
        Run the full scraping pipeline.
        
        Returns:
            List of all scraped conflict dictionaries
        """
        all_conflicts = []
        
        for url in self.get_source_urls():
            try:
                html = self.fetch(url)
                conflicts = self.parse(html, url)
                all_conflicts.extend(conflicts)
                logger.info(f"Scraped {len(conflicts)} conflicts from {url}")
            except Exception as e:
                logger.error(f"Failed to scrape {url}: {e}")
        
        return all_conflicts
