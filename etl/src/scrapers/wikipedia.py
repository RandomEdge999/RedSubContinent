"""
Wikipedia scraper for South Asian conflict data.

This scraper targets Wikipedia's "List of wars" and "List of massacres"
pages to extract structured conflict data.
"""

import logging
import re
from datetime import date
from typing import Any, Optional

from bs4 import BeautifulSoup, Tag

try:
    from ..models import ConflictBatch, ConflictRaw
    from .base import BaseScraper, ScraperConfig
except ImportError:
    from src.models import ConflictBatch, ConflictRaw
    from src.scrapers.base import BaseScraper, ScraperConfig

logger = logging.getLogger(__name__)


# Wikipedia pages to scrape for South Asian conflict data
WIKIPEDIA_CONFLICT_PAGES = [
    # Wars by country
    "https://en.wikipedia.org/wiki/List_of_wars_involving_India",
    "https://en.wikipedia.org/wiki/List_of_wars_involving_Pakistan",
    "https://en.wikipedia.org/wiki/List_of_wars_involving_Bangladesh",
    "https://en.wikipedia.org/wiki/List_of_wars_involving_Afghanistan",
    
    # Massacres
    "https://en.wikipedia.org/wiki/List_of_massacres_in_India",
    "https://en.wikipedia.org/wiki/List_of_massacres_in_Pakistan",
    "https://en.wikipedia.org/wiki/List_of_massacres_in_Bangladesh",
    
    # Specific conflict lists
    "https://en.wikipedia.org/wiki/Indo-Pakistani_wars_and_conflicts",
    "https://en.wikipedia.org/wiki/List_of_modern_conflicts_in_South_Asia",
    
    # British India era
    "https://en.wikipedia.org/wiki/Rebellions_in_British_India",
    
    # Partition
    "https://en.wikipedia.org/wiki/Partition_of_India",
]


class WikipediaScraper(BaseScraper):
    """
    Scraper for Wikipedia conflict data.
    
    Handles various table formats found on Wikipedia including:
    - Standard wikitables
    - Sortable tables
    - Tables with rowspan/colspan
    """
    
    def __init__(
        self,
        urls: Optional[list[str]] = None,
        config: Optional[ScraperConfig] = None,
    ):
        super().__init__(config)
        self._urls = urls or WIKIPEDIA_CONFLICT_PAGES
    
    def get_source_urls(self) -> list[str]:
        """Return list of Wikipedia URLs to scrape."""
        return self._urls
    
    def parse(self, html: str, url: str) -> list[dict]:
        """
        Parse Wikipedia HTML and extract conflict data from tables.
        
        Args:
            html: Raw HTML content
            url: Source URL for reference
            
        Returns:
            List of raw conflict dictionaries
        """
        soup = BeautifulSoup(html, "lxml")
        conflicts: list[dict] = []
        
        # Find all wikitables
        tables = soup.find_all("table", class_="wikitable")
        logger.info(f"Found {len(tables)} tables in {url}")
        
        for table in tables:
            try:
                table_conflicts = self._parse_table(table, url)
                conflicts.extend(table_conflicts)
            except Exception as e:
                logger.warning(f"Failed to parse table: {e}")
        
        return conflicts
    
    def _parse_table(self, table: Tag, source_url: str) -> list[dict]:
        """
        Parse a single wikitable into conflict records.
        
        Handles various column layouts by detecting headers.
        """
        conflicts: list[dict] = []
        
        # Extract headers
        headers = self._extract_headers(table)
        if not headers:
            logger.debug("No headers found in table")
            return []
        
        # Map headers to our schema
        column_map = self._map_columns(headers)
        if not column_map:
            logger.debug(f"Could not map columns: {headers}")
            return []
        
        # Extract rows
        rows = table.find_all("tr")[1:]  # Skip header row
        
        for row in rows:
            try:
                cells = row.find_all(["td", "th"])
                if not cells:
                    continue
                
                conflict_data = self._extract_row_data(cells, column_map, source_url)
                if conflict_data and conflict_data.get("title"):
                    conflicts.append(conflict_data)
            except Exception as e:
                logger.debug(f"Failed to parse row: {e}")
        
        return conflicts
    
    def _extract_headers(self, table: Tag) -> list[str]:
        """Extract and normalize table headers."""
        header_row = table.find("tr")
        if not header_row:
            return []
        
        headers = []
        for th in header_row.find_all(["th", "td"]):
            text = th.get_text(strip=True).lower()
            # Normalize common variations
            text = re.sub(r"\s+", " ", text)
            text = re.sub(r"\[.*?\]", "", text)  # Remove citation brackets
            headers.append(text.strip())
        
        return headers
    
    def _map_columns(self, headers: list[str]) -> dict[str, int]:
        """
        Map table headers to our conflict schema.
        
        Returns a dict mapping field names to column indices.
        """
        column_map: dict[str, int] = {}
        
        # Define patterns for each field
        patterns = {
            "title": [
                r"conflict", r"war", r"name", r"event", r"battle",
                r"massacre", r"incident", r"uprising"
            ],
            "date_text": [
                r"date", r"year", r"period", r"time"
            ],
            "location_text": [
                r"location", r"place", r"region", r"area", r"where"
            ],
            "casualties_text": [
                r"casualties", r"deaths", r"killed", r"fatalities",
                r"victims", r"dead"
            ],
            "belligerents_text": [
                r"belligerents", r"combatants", r"parties", r"sides",
                r"forces", r"participants"
            ],
            "result_text": [
                r"result", r"outcome", r"status"
            ],
            "description": [
                r"description", r"summary", r"notes", r"details"
            ],
        }
        
        for i, header in enumerate(headers):
            for field, field_patterns in patterns.items():
                if field in column_map:
                    continue
                for pattern in field_patterns:
                    if re.search(pattern, header):
                        column_map[field] = i
                        break
        
        # Must have at least a title column
        if "title" not in column_map:
            # Use first column as title if no match
            if headers:
                column_map["title"] = 0
            else:
                return {}
        
        return column_map
    
    def _extract_row_data(
        self,
        cells: list[Tag],
        column_map: dict[str, int],
        source_url: str,
    ) -> dict[str, Any]:
        """Extract data from a table row using the column map."""
        data: dict[str, Any] = {
            "source_url": source_url,
            "references": [],
        }
        
        for field, col_idx in column_map.items():
            if col_idx >= len(cells):
                continue
            
            cell = cells[col_idx]
            
            # Extract text content
            text = self._clean_cell_text(cell)
            if text:
                data[field] = text
            
            # Extract references from the title cell
            if field == "title":
                refs = self._extract_references(cell)
                data["references"].extend(refs)
        
        return data
    
    def _clean_cell_text(self, cell: Tag) -> str:
        """Clean text content from a table cell."""
        # Remove superscript references like [1], [2]
        for sup in cell.find_all("sup"):
            sup.decompose()
        
        text = cell.get_text(separator=" ", strip=True)
        
        # Clean up whitespace
        text = re.sub(r"\s+", " ", text)
        
        # Remove remaining bracket references
        text = re.sub(r"\[\d+\]", "", text)
        text = re.sub(r"\[citation needed\]", "", text, flags=re.IGNORECASE)
        
        return text.strip()
    
    def _extract_references(self, cell: Tag) -> list[str]:
        """Extract Wikipedia reference URLs from a cell."""
        refs: list[str] = []
        
        # Find links to Wikipedia articles
        for link in cell.find_all("a", href=True):
            href = link["href"]
            if href.startswith("/wiki/") and not href.startswith("/wiki/File:"):
                full_url = f"https://en.wikipedia.org{href}"
                refs.append(full_url)
        
        return refs
    
    def scrape_to_batch(self, url: str) -> ConflictBatch:
        """
        Scrape a single URL and return a ConflictBatch.
        
        This method converts raw dictionaries to Pydantic models.
        """
        errors: list[str] = []
        conflicts: list[ConflictRaw] = []
        
        try:
            html = self.fetch(url)
            raw_conflicts = self.parse(html, url)
            
            for raw in raw_conflicts:
                try:
                    conflict = ConflictRaw(**raw)
                    conflicts.append(conflict)
                except Exception as e:
                    errors.append(f"Validation error for '{raw.get('title', 'Unknown')}': {e}")
        except Exception as e:
            errors.append(f"Fetch error: {e}")
        
        return ConflictBatch(
            source_url=url,
            source_name="Wikipedia",
            scraped_at=date.today(),
            conflicts=conflicts,
            errors=errors,
        )
    
    def scrape_all(self) -> list[ConflictBatch]:
        """
        Scrape all configured URLs and return batches.
        
        Returns:
            List of ConflictBatch objects, one per URL
        """
        batches: list[ConflictBatch] = []
        
        for url in self.get_source_urls():
            logger.info(f"Scraping: {url}")
            batch = self.scrape_to_batch(url)
            batches.append(batch)
            logger.info(
                f"Scraped {batch.success_count} conflicts, "
                f"{batch.error_count} errors from {url}"
            )
        
        return batches


def scrape_wikipedia_conflicts(
    urls: Optional[list[str]] = None,
    cache_dir: Optional[str] = None,
) -> list[ConflictBatch]:
    """
    Convenience function to scrape Wikipedia conflict data.
    
    Args:
        urls: Optional list of URLs to scrape. Defaults to WIKIPEDIA_CONFLICT_PAGES
        cache_dir: Optional cache directory path
        
    Returns:
        List of ConflictBatch objects with scraped data
    """
    config = ScraperConfig()
    if cache_dir:
        from pathlib import Path
        config.cache_directory = Path(cache_dir)
    
    with WikipediaScraper(urls=urls, config=config) as scraper:
        return scraper.scrape_all()
