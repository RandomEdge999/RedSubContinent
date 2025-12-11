"""Web scrapers for conflict data sources."""

from .base import BaseScraper, ScraperConfig
from .wikipedia import WikipediaScraper, scrape_wikipedia_conflicts

__all__ = [
    "BaseScraper",
    "ScraperConfig",
    "WikipediaScraper",
    "scrape_wikipedia_conflicts",
]
