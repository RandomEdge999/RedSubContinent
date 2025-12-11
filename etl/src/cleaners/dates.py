"""
Date parsing utilities for historical events.

Handles various date formats found in historical sources:
- Exact dates: "April 21, 1526"
- Year ranges: "1857-1858"
- Approximate dates: "early 12th century", "c. 1200"
- Partial dates: "1947", "April 1947"
"""

import re
from dataclasses import dataclass
from datetime import date
from typing import Optional, Tuple

from ..models import DatePrecision


@dataclass
class ParsedDate:
    """Result of parsing a date string."""
    
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    precision: DatePrecision = DatePrecision.YEAR
    original_text: str = ""
    
    @property
    def is_valid(self) -> bool:
        """Check if at least one date was parsed."""
        return self.start_date is not None or self.end_date is not None


# Month name to number mapping
MONTHS = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12,
}

# Century text to year mapping
CENTURY_TEXT = {
    "11th": 1000,
    "12th": 1100,
    "13th": 1200,
    "14th": 1300,
    "15th": 1400,
    "16th": 1500,
    "17th": 1600,
    "18th": 1700,
    "19th": 1800,
    "20th": 1900,
    "21st": 2000,
}


def parse_date_text(text: str) -> ParsedDate:
    """
    Parse various date formats into structured date information.
    
    Args:
        text: Raw date string from a source
        
    Returns:
        ParsedDate with extracted date information
    """
    if not text:
        return ParsedDate(original_text=text)
    
    # Clean the text
    text = text.strip()
    original_text = text
    text_lower = text.lower()
    
    # Try various parsing strategies in order of specificity
    
    # 1. Try exact date: "April 21, 1526" or "21 April 1526"
    exact_date = _parse_exact_date(text)
    if exact_date:
        return ParsedDate(
            start_date=exact_date,
            end_date=exact_date,
            precision=DatePrecision.EXACT,
            original_text=original_text,
        )
    
    # 2. Try year range: "1857-1858" or "1857–1858"
    year_range = _parse_year_range(text)
    if year_range:
        start_year, end_year = year_range
        return ParsedDate(
            start_date=date(start_year, 1, 1),
            end_date=date(end_year, 12, 31),
            precision=DatePrecision.YEAR,
            original_text=original_text,
        )
    
    # 3. Try month-year: "April 1947"
    month_year = _parse_month_year(text)
    if month_year:
        year, month = month_year
        # Get last day of month
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        end_date = date(end_date.year, end_date.month, 1) - __import__("datetime").timedelta(days=1)
        
        return ParsedDate(
            start_date=date(year, month, 1),
            end_date=end_date,
            precision=DatePrecision.MONTH,
            original_text=original_text,
        )
    
    # 4. Try single year: "1947" or "c. 1200"
    single_year = _parse_single_year(text)
    if single_year:
        return ParsedDate(
            start_date=date(single_year, 1, 1),
            end_date=date(single_year, 12, 31),
            precision=DatePrecision.YEAR,
            original_text=original_text,
        )
    
    # 5. Try century: "12th century", "early 11th century"
    century_range = _parse_century(text_lower)
    if century_range:
        start_year, end_year = century_range
        return ParsedDate(
            start_date=date(start_year, 1, 1),
            end_date=date(end_year, 12, 31),
            precision=DatePrecision.CENTURY,
            original_text=original_text,
        )
    
    # 6. Try decade: "1940s", "the 1200s"
    decade = _parse_decade(text_lower)
    if decade:
        return ParsedDate(
            start_date=date(decade, 1, 1),
            end_date=date(decade + 9, 12, 31),
            precision=DatePrecision.DECADE,
            original_text=original_text,
        )
    
    # Could not parse
    return ParsedDate(original_text=original_text)


def _parse_exact_date(text: str) -> Optional[date]:
    """Parse exact date like 'April 21, 1526' or '21 April 1526'."""
    
    # Pattern: Month Day, Year
    pattern1 = r"(\w+)\s+(\d{1,2}),?\s+(\d{4})"
    match = re.search(pattern1, text)
    if match:
        month_name = match.group(1).lower()
        day = int(match.group(2))
        year = int(match.group(3))
        
        month = MONTHS.get(month_name)
        if month and 1 <= day <= 31 and 1000 <= year <= 2100:
            try:
                return date(year, month, day)
            except ValueError:
                pass
    
    # Pattern: Day Month Year
    pattern2 = r"(\d{1,2})\s+(\w+)\s+(\d{4})"
    match = re.search(pattern2, text)
    if match:
        day = int(match.group(1))
        month_name = match.group(2).lower()
        year = int(match.group(3))
        
        month = MONTHS.get(month_name)
        if month and 1 <= day <= 31 and 1000 <= year <= 2100:
            try:
                return date(year, month, day)
            except ValueError:
                pass
    
    return None


def _parse_year_range(text: str) -> Optional[Tuple[int, int]]:
    """Parse year range like '1857-1858' or '1857–1858'."""
    
    # Match patterns like 1857-1858, 1857–1858, 1857 to 1858
    pattern = r"(\d{4})\s*[-–—to]\s*(\d{4})"
    match = re.search(pattern, text)
    if match:
        start_year = int(match.group(1))
        end_year = int(match.group(2))
        
        if 1000 <= start_year <= 2100 and 1000 <= end_year <= 2100:
            if start_year <= end_year:
                return (start_year, end_year)
    
    return None


def _parse_month_year(text: str) -> Optional[Tuple[int, int]]:
    """Parse month-year like 'April 1947'."""
    
    pattern = r"(\w+)\s+(\d{4})"
    match = re.search(pattern, text)
    if match:
        month_name = match.group(1).lower()
        year = int(match.group(2))
        
        month = MONTHS.get(month_name)
        if month and 1000 <= year <= 2100:
            return (year, month)
    
    return None


def _parse_single_year(text: str) -> Optional[int]:
    """Parse single year like '1947' or 'c. 1200'."""
    
    # Remove common prefixes
    text = re.sub(r"c\.?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"circa\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"approximately\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"about\s*", "", text, flags=re.IGNORECASE)
    
    # Match 4-digit year
    pattern = r"\b(\d{4})\b"
    match = re.search(pattern, text)
    if match:
        year = int(match.group(1))
        if 1000 <= year <= 2100:
            return year
    
    return None


def _parse_century(text: str) -> Optional[Tuple[int, int]]:
    """Parse century like '12th century', 'early 11th century'."""
    
    for century_name, base_year in CENTURY_TEXT.items():
        if century_name in text:
            start_year = base_year
            end_year = base_year + 99
            
            # Adjust for early/mid/late
            if "early" in text:
                end_year = base_year + 33
            elif "mid" in text:
                start_year = base_year + 34
                end_year = base_year + 66
            elif "late" in text:
                start_year = base_year + 67
            
            return (start_year, end_year)
    
    return None


def _parse_decade(text: str) -> Optional[int]:
    """Parse decade like '1940s' or 'the 1200s'."""
    
    pattern = r"\b(\d{3})0s\b"
    match = re.search(pattern, text)
    if match:
        decade_start = int(match.group(1)) * 10
        if 1000 <= decade_start <= 2090:
            return decade_start
    
    return None
