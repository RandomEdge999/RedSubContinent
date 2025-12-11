"""
Main ETL pipeline for processing conflict data.

Orchestrates:
1. Scraping raw data from sources
2. Cleaning and normalizing data
3. Geocoding locations
4. Validating with Pydantic models
5. Outputting cleaned data for database insertion
"""

import json
import logging
from datetime import date
from pathlib import Path
from typing import Optional
from uuid import uuid4

from slugify import slugify

from .cleaners import (
    ParsedCasualties,
    ParsedDate,
    geocode_location,
    parse_casualties_text,
    parse_date_text,
)
from .models import (
    ActorData,
    ActorRole,
    CasualtiesRange,
    ConflictCleaned,
    ConflictRaw,
    ConflictScale,
    ConflictType,
    DatePrecision,
    LocationData,
    SourceData,
    SourceType,
)
from .scrapers import WikipediaScraper, scrape_wikipedia_conflicts

logger = logging.getLogger(__name__)


def infer_conflict_type(title: str, description: Optional[str] = None) -> ConflictType:
    """
    Infer conflict type from title and description.
    
    Uses keyword matching to categorize events.
    """
    text = (title + " " + (description or "")).lower()
    
    if any(word in text for word in ["massacre", "pogrom", "slaughter"]):
        return ConflictType.MASSACRE
    if any(word in text for word in ["riot", "riots"]):
        return ConflictType.RIOT
    if any(word in text for word in ["famine", "starvation"]):
        return ConflictType.FAMINE
    if any(word in text for word in ["partition"]):
        return ConflictType.PARTITION_EVENT
    if any(word in text for word in ["uprising", "revolt", "rebellion", "mutiny"]):
        return ConflictType.UPRISING
    if any(word in text for word in ["invasion", "invaded"]):
        return ConflictType.INVASION
    if any(word in text for word in ["campaign"]):
        return ConflictType.IMPERIAL_CAMPAIGN
    if any(word in text for word in ["civil war"]):
        return ConflictType.CIVIL_CONFLICT
    if any(word in text for word in ["communal", "sectarian"]):
        return ConflictType.COMMUNAL_VIOLENCE
    if any(word in text for word in ["war", "battle", "siege"]):
        return ConflictType.WAR
    
    return ConflictType.OTHER


def infer_conflict_scale(locations: list[str], casualties: Optional[int]) -> ConflictScale:
    """
    Infer conflict scale from location count and casualties.
    """
    if casualties is not None:
        if casualties > 100000:
            return ConflictScale.SUBCONTINENTAL
        if casualties > 10000:
            return ConflictScale.REGIONAL
        if casualties > 1000:
            return ConflictScale.REGIONAL
    
    if len(locations) > 3:
        return ConflictScale.REGIONAL
    
    return ConflictScale.LOCAL


def clean_raw_conflict(raw: ConflictRaw) -> Optional[ConflictCleaned]:
    """
    Transform a raw scraped conflict into a cleaned, validated record.
    
    Args:
        raw: Raw conflict data from scraping
        
    Returns:
        ConflictCleaned if successful, None if data is too incomplete
    """
    try:
        # Parse dates
        date_text = raw.date_text or raw.start_date_text or ""
        parsed_date: ParsedDate = parse_date_text(date_text)
        
        # If we have separate start/end dates, try those too
        start_date = parsed_date.start_date
        end_date = parsed_date.end_date
        date_precision = parsed_date.precision
        
        if raw.end_date_text and not end_date:
            end_parsed = parse_date_text(raw.end_date_text)
            if end_parsed.end_date:
                end_date = end_parsed.end_date
        
        # Parse casualties
        casualties_parsed: ParsedCasualties = parse_casualties_text(raw.casualties_text or "")
        casualties = CasualtiesRange(
            low=casualties_parsed.low,
            high=casualties_parsed.high,
            best_estimate=casualties_parsed.calculate_best_estimate(),
            includes_injuries=casualties_parsed.includes_injuries,
            notes=casualties_parsed.notes or None,
        )
        
        # Parse location
        locations: list[LocationData] = []
        if raw.location_text:
            # Split on common separators
            location_names = [
                loc.strip()
                for loc in raw.location_text.replace(";", ",").split(",")
                if loc.strip()
            ]
            
            for i, loc_name in enumerate(location_names[:5]):  # Limit to 5 locations
                geo_result = geocode_location(loc_name)
                locations.append(LocationData(
                    name=loc_name,
                    latitude=geo_result.latitude,
                    longitude=geo_result.longitude,
                    is_primary=(i == 0),
                ))
        
        # Infer conflict type
        conflict_type = infer_conflict_type(raw.title, raw.description)
        
        # Infer scale
        scale = infer_conflict_scale(
            [loc.name for loc in locations],
            casualties.best_estimate,
        )
        
        # Generate slug
        slug = slugify(raw.title, max_length=100)
        
        # Create source record
        sources: list[SourceData] = [
            SourceData(
                source_type=SourceType.WIKIPEDIA,
                url=raw.source_url,
                accessed_date=date.today(),
            )
        ]
        
        # Add reference URLs as additional sources
        for ref_url in raw.references[:5]:  # Limit references
            sources.append(SourceData(
                source_type=SourceType.WIKIPEDIA,
                url=ref_url,
                title="Related Wikipedia article",
            ))
        
        # Determine primary region from locations
        primary_region = None
        if locations:
            primary_region = locations[0].name
        
        # Check if we have minimum required data
        if not raw.title:
            logger.warning(f"Skipping conflict: no title")
            return None
        
        # Create cleaned record
        cleaned = ConflictCleaned(
            id=uuid4(),
            title=raw.title,
            slug=slug,
            conflict_type=conflict_type,
            conflict_scale=scale,
            description_short=raw.description[:500] if raw.description else None,
            description_long=raw.description,
            start_date=start_date,
            end_date=end_date,
            date_precision=date_precision,
            casualties=casualties,
            primary_region=primary_region,
            locations=locations,
            actors=[],  # Would need additional parsing
            sources=sources,
            notes=raw.notes,
            uncertainty_notes=casualties_parsed.notes if casualties_parsed.notes else None,
        )
        
        return cleaned
        
    except Exception as e:
        logger.error(f"Failed to clean conflict '{raw.title}': {e}")
        return None


def run_pipeline(
    output_dir: Optional[Path] = None,
    scrape_urls: Optional[list[str]] = None,
    skip_scraping: bool = False,
    raw_data_file: Optional[Path] = None,
) -> list[ConflictCleaned]:
    """
    Run the full ETL pipeline.
    
    Args:
        output_dir: Directory to write output files
        scrape_urls: Optional list of URLs to scrape (uses defaults if None)
        skip_scraping: If True, skip scraping and use raw_data_file
        raw_data_file: Path to previously scraped raw data
        
    Returns:
        List of cleaned conflict records
    """
    output_dir = output_dir or Path("data/processed")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Step 1: Scrape or load raw data
    if skip_scraping and raw_data_file and raw_data_file.exists():
        logger.info(f"Loading raw data from {raw_data_file}")
        raw_data = json.loads(raw_data_file.read_text(encoding="utf-8"))
        raw_conflicts = [ConflictRaw(**item) for item in raw_data]
    else:
        logger.info("Scraping conflict data...")
        batches = scrape_wikipedia_conflicts(urls=scrape_urls)
        
        # Flatten batches into raw conflicts
        raw_conflicts: list[ConflictRaw] = []
        for batch in batches:
            raw_conflicts.extend(batch.conflicts)
        
        # Save raw data
        raw_file = output_dir / "raw_conflicts.json"
        raw_data = [c.model_dump() for c in raw_conflicts]
        raw_file.write_text(json.dumps(raw_data, indent=2, default=str), encoding="utf-8")
        logger.info(f"Saved {len(raw_conflicts)} raw conflicts to {raw_file}")
    
    # Step 2: Clean and normalize
    logger.info("Cleaning and normalizing conflicts...")
    cleaned_conflicts: list[ConflictCleaned] = []
    
    for raw in raw_conflicts:
        cleaned = clean_raw_conflict(raw)
        if cleaned:
            cleaned_conflicts.append(cleaned)
    
    logger.info(f"Cleaned {len(cleaned_conflicts)} of {len(raw_conflicts)} conflicts")
    
    # Step 3: Deduplicate by slug
    seen_slugs: set[str] = set()
    deduplicated: list[ConflictCleaned] = []
    
    for conflict in cleaned_conflicts:
        if conflict.slug not in seen_slugs:
            seen_slugs.add(conflict.slug)
            deduplicated.append(conflict)
    
    logger.info(f"After deduplication: {len(deduplicated)} conflicts")
    
    # Step 4: Save cleaned data
    cleaned_file = output_dir / "cleaned_conflicts.json"
    cleaned_data = [c.model_dump() for c in deduplicated]
    cleaned_file.write_text(json.dumps(cleaned_data, indent=2, default=str), encoding="utf-8")
    logger.info(f"Saved cleaned conflicts to {cleaned_file}")
    
    return deduplicated


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    conflicts = run_pipeline()
    print(f"\nPipeline complete. Processed {len(conflicts)} conflicts.")
