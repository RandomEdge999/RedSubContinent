"""
Casualty parsing utilities.

Converts various textual casualty descriptions into structured
low/high/best estimate values.
"""

import re
from dataclasses import dataclass
from typing import Optional, Tuple


@dataclass
class ParsedCasualties:
    """Result of parsing a casualty string."""
    
    low: Optional[int] = None
    high: Optional[int] = None
    best_estimate: Optional[int] = None
    includes_injuries: bool = False
    notes: str = ""
    original_text: str = ""
    
    @property
    def is_valid(self) -> bool:
        """Check if any casualty figure was parsed."""
        return any([self.low, self.high, self.best_estimate])
    
    def calculate_best_estimate(self) -> Optional[int]:
        """Calculate best estimate from range if not provided."""
        if self.best_estimate is not None:
            return self.best_estimate
        if self.low is not None and self.high is not None:
            # Use geometric mean for large ranges
            if self.high > self.low * 5:
                import math
                return int(math.sqrt(self.low * self.high))
            return (self.low + self.high) // 2
        return self.low or self.high


# Mapping of textual quantities to numeric estimates
QUANTITY_WORDS = {
    # Low quantities
    "few": (2, 10, 5),
    "several": (3, 12, 7),
    "some": (5, 20, 10),
    "a dozen": (10, 14, 12),
    "dozens": (24, 100, 50),
    
    # Hundreds
    "hundred": (100, 100, 100),
    "hundreds": (200, 900, 400),
    "several hundred": (200, 900, 500),
    "many hundreds": (500, 900, 700),
    
    # Thousands
    "thousand": (1000, 1000, 1000),
    "thousands": (2000, 9000, 4000),
    "several thousand": (2000, 9000, 5000),
    "many thousand": (5000, 9000, 7000),
    "many thousands": (5000, 15000, 10000),
    "tens of thousands": (10000, 99000, 30000),
    
    # Tens of thousands
    "over ten thousand": (10000, 20000, 15000),
    "over 10,000": (10000, 20000, 15000),
    "over 10000": (10000, 20000, 15000),
    
    # Hundreds of thousands
    "hundreds of thousands": (100000, 900000, 300000),
    "several hundred thousand": (200000, 900000, 500000),
    
    # Millions
    "million": (1000000, 1000000, 1000000),
    "millions": (2000000, 10000000, 5000000),
    "several million": (2000000, 10000000, 5000000),
    
    # Vague terms
    "heavy": (None, None, None),
    "heavy casualties": (None, None, None),
    "significant": (None, None, None),
    "unknown": (None, None, None),
    "uncertain": (None, None, None),
}


def parse_casualties_text(text: str) -> ParsedCasualties:
    """
    Parse casualty text into structured estimates.
    
    Handles formats like:
    - "50,000" -> (50000, 50000, 50000)
    - "20,000-50,000" -> (20000, 50000, 35000)
    - "tens of thousands" -> (10000, 99000, 30000)
    - "several hundred" -> (200, 900, 500)
    
    Args:
        text: Raw casualty string from a source
        
    Returns:
        ParsedCasualties with extracted values
    """
    if not text:
        return ParsedCasualties(original_text=text)
    
    # Clean the text
    text = text.strip()
    original_text = text
    text_lower = text.lower()
    
    # Check if injuries are mentioned
    includes_injuries = bool(re.search(
        r"injur|wound|hurt|casualt",
        text_lower
    ))
    
    # Check for explicit "killed" or "deaths" to exclude injuries
    deaths_only = bool(re.search(
        r"killed|deaths|dead|died|fatalities",
        text_lower
    ))
    if deaths_only:
        includes_injuries = False
    
    # Try various parsing strategies
    
    # 1. Try numeric range: "20,000-50,000" or "20000 to 50000"
    range_result = _parse_numeric_range(text)
    if range_result:
        low, high = range_result
        return ParsedCasualties(
            low=low,
            high=high,
            best_estimate=_calculate_best(low, high),
            includes_injuries=includes_injuries,
            original_text=original_text,
        )
    
    # 2. Try single number: "50,000" or "50000"
    single_number = _parse_single_number(text)
    if single_number:
        return ParsedCasualties(
            low=single_number,
            high=single_number,
            best_estimate=single_number,
            includes_injuries=includes_injuries,
            original_text=original_text,
        )
    
    # 3. Try textual quantities: "tens of thousands"
    for phrase, (low, high, best) in QUANTITY_WORDS.items():
        if phrase in text_lower:
            return ParsedCasualties(
                low=low,
                high=high,
                best_estimate=best,
                includes_injuries=includes_injuries,
                notes=f"Interpreted from '{phrase}'",
                original_text=original_text,
            )
    
    # 4. Check for "over X" or "more than X"
    over_result = _parse_over_number(text)
    if over_result:
        low = over_result
        # Assume 50% more as high estimate
        high = int(low * 1.5)
        return ParsedCasualties(
            low=low,
            high=high,
            best_estimate=int(low * 1.2),
            includes_injuries=includes_injuries,
            notes="Lower bound from 'over/more than' phrasing",
            original_text=original_text,
        )
    
    # 5. Check for "approximately X" or "about X" or "~X"
    approx_result = _parse_approximate_number(text)
    if approx_result:
        # Add 20% margin for approximate
        low = int(approx_result * 0.8)
        high = int(approx_result * 1.2)
        return ParsedCasualties(
            low=low,
            high=high,
            best_estimate=approx_result,
            includes_injuries=includes_injuries,
            notes="Approximate figure with ±20% margin",
            original_text=original_text,
        )
    
    # Could not parse
    return ParsedCasualties(
        includes_injuries=includes_injuries,
        notes="Could not parse numeric value",
        original_text=original_text,
    )


def _parse_numeric_range(text: str) -> Optional[Tuple[int, int]]:
    """Parse ranges like '20,000-50,000' or '20000 to 50000'."""
    
    # Remove commas for easier parsing
    text_clean = text.replace(",", "")
    
    # Match patterns like 20000-50000, 20000–50000, 20000 to 50000
    pattern = r"(\d+)\s*[-–—to]\s*(\d+)"
    match = re.search(pattern, text_clean)
    if match:
        low = int(match.group(1))
        high = int(match.group(2))
        if low <= high:
            return (low, high)
    
    return None


def _parse_single_number(text: str) -> Optional[int]:
    """Parse single number like '50,000' or '50000'."""
    
    # Remove commas
    text_clean = text.replace(",", "")
    
    # Match isolated numbers (not part of a range)
    # Avoid matching years like 1947
    pattern = r"(?<!\d[-–—])\b(\d+)\b(?![-–—]\d)"
    matches = re.findall(pattern, text_clean)
    
    for match in matches:
        num = int(match)
        # Skip likely years
        if 1000 <= num <= 2100:
            continue
        if num > 0:
            return num
    
    return None


def _parse_over_number(text: str) -> Optional[int]:
    """Parse 'over X' or 'more than X' patterns."""
    
    text_clean = text.replace(",", "")
    
    pattern = r"(?:over|more than|at least|minimum)\s+(\d+)"
    match = re.search(pattern, text_clean, re.IGNORECASE)
    if match:
        return int(match.group(1))
    
    return None


def _parse_approximate_number(text: str) -> Optional[int]:
    """Parse approximate numbers like 'approximately 50000', 'about 50000', '~50000'."""
    
    text_clean = text.replace(",", "")
    
    pattern = r"(?:approximately|approx\.?|about|around|circa|c\.?|~)\s*(\d+)"
    match = re.search(pattern, text_clean, re.IGNORECASE)
    if match:
        return int(match.group(1))
    
    return None


def _calculate_best(low: int, high: int) -> int:
    """Calculate best estimate from a range."""
    import math
    
    # Use geometric mean for large ranges (more than 5x difference)
    if high > low * 5:
        return int(math.sqrt(low * high))
    
    # Otherwise use arithmetic mean
    return (low + high) // 2
