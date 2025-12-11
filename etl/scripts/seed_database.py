#!/usr/bin/env python3
"""
Script to seed the database with scraped conflict data.
"""

import argparse
import json
import sys
import uuid
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import psycopg2
from slugify import slugify


def parse_date_text(date_text: str) -> tuple[Optional[str], Optional[str], str]:
    """
    Parse date text into start_date, end_date, and precision.
    Returns (start_date, end_date, precision) where dates are ISO format or None.
    """
    if not date_text:
        return None, None, "unknown"
    
    text = date_text.strip()
    
    # Try to extract years
    year_pattern = r'\b(\d{4})\b'
    years = re.findall(year_pattern, text)
    
    if len(years) >= 2:
        start_year = min(int(y) for y in years)
        end_year = max(int(y) for y in years)
        return f"{start_year}-01-01", f"{end_year}-12-31", "year"
    elif len(years) == 1:
        year = years[0]
        return f"{year}-01-01", f"{year}-12-31", "year"
    
    # Check for century patterns
    century_match = re.search(r'(\d{1,2})(?:st|nd|rd|th)\s+century', text.lower())
    if century_match:
        century = int(century_match.group(1))
        start_year = (century - 1) * 100
        end_year = century * 100 - 1
        return f"{start_year}-01-01", f"{end_year}-12-31", "century"
    
    return None, None, "unknown"


def parse_casualties_text(casualties_text: str) -> tuple[Optional[int], Optional[int], Optional[int]]:
    """
    Parse casualty text into (low, high, best_estimate).
    """
    if not casualties_text:
        return None, None, None
    
    text = casualties_text.lower().replace(",", "").replace(" ", "")
    
    # Look for number ranges like "1000-5000" or "1000 to 5000"
    range_match = re.search(r'(\d+)[-–to]+(\d+)', text)
    if range_match:
        low = int(range_match.group(1))
        high = int(range_match.group(2))
        best = (low + high) // 2
        return low, high, best
    
    # Look for single numbers
    num_match = re.search(r'(\d+)', text)
    if num_match:
        num = int(num_match.group(1))
        return num, num, num
    
    # Qualitative descriptions
    if "million" in text:
        match = re.search(r'(\d+(?:\.\d+)?)', text)
        if match:
            num = int(float(match.group(1)) * 1000000)
            return num, num, num
    
    if "thousand" in text:
        match = re.search(r'(\d+)', text)
        if match:
            num = int(match.group(1)) * 1000
            return num, num, num
    
    return None, None, None


def infer_conflict_type(title: str, description: str = "") -> str:
    """Infer conflict type from title and description."""
    text = (title + " " + (description or "")).lower()
    
    if "massacre" in text or "genocide" in text or "pogrom" in text:
        return "massacre"
    if "famine" in text:
        return "famine"
    if "riot" in text:
        return "riot"
    if "uprising" in text or "rebellion" in text or "revolt" in text:
        return "uprising"
    if "invasion" in text:
        return "invasion"
    if "partition" in text:
        return "partition_event"
    if "civil" in text:
        return "civil_conflict"
    if "communal" in text:
        return "communal_violence"
    if "war" in text or "battle" in text or "siege" in text:
        return "war"
    
    return "other"


def seed_database(conn, conflicts: list, clear_existing: bool = False):
    """Insert conflicts into the database."""
    cur = conn.cursor()
    
    if clear_existing:
        print("Clearing existing data...")
        cur.execute("TRUNCATE conflicts CASCADE")
        conn.commit()
    
    inserted = 0
    skipped = 0
    
    for conflict in conflicts:
        title = conflict.get("title", "").strip()
        if not title or len(title) < 3:
            skipped += 1
            continue
        
        # Generate slug
        slug = slugify(title)[:490]
        
        # Check if slug already exists
        cur.execute("SELECT id FROM conflicts WHERE slug = %s", (slug,))
        if cur.fetchone():
            # Append unique suffix
            slug = f"{slug}-{str(uuid.uuid4())[:8]}"
        
        # Parse dates
        date_text = conflict.get("date_text", "")
        start_date, end_date, date_precision = parse_date_text(date_text)
        
        # Parse casualties
        casualties_text = conflict.get("casualties_text", "")
        cas_low, cas_high, cas_best = parse_casualties_text(casualties_text)
        
        # Infer type
        conflict_type = infer_conflict_type(
            title, 
            conflict.get("description", "")
        )
        
        # Get location
        location_text = conflict.get("location_text", "")
        
        # Get source
        source_url = conflict.get("source_url", "")
        
        try:
            # Insert conflict
            cur.execute("""
                INSERT INTO conflicts (
                    id, title, slug, conflict_type, conflict_scale,
                    start_date, end_date, date_precision,
                    casualties_low, casualties_high, casualties_best,
                    primary_region, notes
                ) VALUES (
                    uuid_generate_v4(), %s, %s, %s, 'regional',
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s
                ) RETURNING id
            """, (
                title, slug, conflict_type,
                start_date, end_date, date_precision,
                cas_low, cas_high, cas_best,
                location_text[:255] if location_text else None,
                f"Date: {date_text}" if date_text else None
            ))
            
            conflict_id = cur.fetchone()[0]
            
            # Insert source
            if source_url:
                cur.execute("""
                    INSERT INTO conflict_sources (
                        id, conflict_id, source_type, source_url, accessed_date
                    ) VALUES (
                        uuid_generate_v4(), %s, 'wikipedia', %s, CURRENT_DATE
                    )
                """, (conflict_id, source_url))
            
            inserted += 1
            
        except Exception as e:
            print(f"  Error inserting '{title}': {e}")
            conn.rollback()
            skipped += 1
            continue
    
    conn.commit()
    cur.close()
    
    return inserted, skipped


def main():
    parser = argparse.ArgumentParser(
        description="Seed database with scraped conflict data"
    )
    parser.add_argument(
        "--input-file",
        type=str,
        help="Specific JSON file to load (default: most recent in data/raw)",
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear existing data before seeding",
    )
    parser.add_argument(
        "--database-url",
        type=str,
        default="postgresql://redsubcontinent:redsubcontinent@localhost:5432/redsubcontinent",
        help="Database connection URL",
    )
    
    args = parser.parse_args()
    
    # Find input file
    if args.input_file:
        input_file = Path(args.input_file)
    else:
        raw_dir = Path("data/raw")
        json_files = sorted(raw_dir.glob("conflicts_raw_*.json"), reverse=True)
        if not json_files:
            print("Error: No scraped data files found in data/raw")
            return 1
        input_file = json_files[0]
    
    print(f"Loading data from: {input_file}")
    
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    conflicts = data.get("conflicts", [])
    print(f"Found {len(conflicts)} conflicts in file")
    
    # Connect to database
    print(f"\nConnecting to database...")
    conn = psycopg2.connect(args.database_url)
    
    # Seed data
    print("Seeding database...")
    inserted, skipped = seed_database(conn, conflicts, args.clear)
    
    print(f"\nDone: {inserted} inserted, {skipped} skipped")
    
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
