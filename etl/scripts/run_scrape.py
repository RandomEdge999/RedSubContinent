#!/usr/bin/env python3
"""
Script to run the Wikipedia scraper and save raw conflict data.
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.scrapers.wikipedia import WikipediaScraper, WIKIPEDIA_CONFLICT_PAGES


def main():
    parser = argparse.ArgumentParser(
        description="Scrape conflict data from Wikipedia"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data/raw",
        help="Output directory for scraped data",
    )
    parser.add_argument(
        "--urls",
        nargs="+",
        help="Specific Wikipedia URLs to scrape (default: all known pages)",
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Test mode: scrape only the first URL",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Verbose output",
    )
    
    args = parser.parse_args()
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Determine URLs to scrape - WIKIPEDIA_CONFLICT_PAGES is a list
    urls = args.urls or WIKIPEDIA_CONFLICT_PAGES
    
    if args.test:
        urls = urls[:1]
        print(f"Test mode: scraping only first URL")
    
    print(f"Scraping {len(urls)} Wikipedia pages...")
    
    # Initialize scraper
    scraper = WikipediaScraper(urls=urls)
    
    all_conflicts = []
    
    for url in urls:
        if args.verbose:
            print(f"\nScraping: {url}")
        
        try:
            batch = scraper.scrape_to_batch(url)
            
            if batch and batch.conflicts:
                all_conflicts.extend(batch.conflicts)
                print(f"  Found {len(batch.conflicts)} conflicts")
            else:
                print(f"  No conflicts found")
                
        except Exception as e:
            print(f"  Error: {e}")
            if args.verbose:
                import traceback
                traceback.print_exc()
    
    # Save results
    if all_conflicts:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = output_dir / f"conflicts_raw_{timestamp}.json"
        
        # Convert to JSON-serializable format
        data = {
            "scraped_at": datetime.now().isoformat(),
            "source_count": len(urls),
            "conflict_count": len(all_conflicts),
            "conflicts": [c.model_dump() for c in all_conflicts],
        }
        
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\nSaved {len(all_conflicts)} conflicts to {output_file}")
    else:
        print("\nNo conflicts scraped")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
