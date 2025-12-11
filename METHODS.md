# Data Methodology

This document describes how data was collected, processed, and validated for the Red SubContinent project.

## Table of Contents

1. [Data Sources](#data-sources)
2. [Collection Methodology](#collection-methodology)
3. [Data Cleaning](#data-cleaning)
4. [Uncertainty Handling](#uncertainty-handling)
5. [Geocoding](#geocoding)
6. [Limitations](#limitations)
7. [Ethical Considerations](#ethical-considerations)

---

## Data Sources

### Primary Sources

#### Wikipedia
- **Lists of wars involving India, Pakistan, Bangladesh, Afghanistan**
- **Lists of massacres by region**
- **Individual conflict articles**

Wikipedia was chosen as an initial source because:
- Broad coverage of historical events
- Active community verification
- Inline citations to primary sources
- Freely accessible

**Limitations:** Wikipedia can have biases, gaps, and occasional inaccuracies. We cross-reference with academic sources where possible and flag high-uncertainty entries.

#### Academic Datasets
- **Correlates of War (COW)**: Interstate wars database
- **PRIO/UCDP**: Armed conflict data (modern era)
- **Gleditsch**: Historical state boundaries

### Source Reliability Tiers

| Tier | Description | Examples |
|------|-------------|----------|
| 1 | Peer-reviewed academic sources | COW, academic books |
| 2 | Verified reference works | Encyclopedia Britannica, Oxford Reference |
| 3 | Wikipedia with cited sources | Wikipedia articles with references |
| 4 | Wikipedia without sources | Uncited Wikipedia claims |
| 5 | Estimates based on similar events | Inferred data |

---

## Collection Methodology

### Automated Scraping

1. **HTML Download**: Fetch Wikipedia pages respecting robots.txt and rate limits
2. **Table Extraction**: Parse HTML tables using BeautifulSoup
3. **Field Mapping**: Map table columns to our schema
4. **Reference Extraction**: Extract inline citations for source tracking

### Manual Curation

For significant events:
- Cross-reference multiple sources
- Verify casualty figures
- Add detailed descriptions
- Flag controversial or disputed data

---

## Data Cleaning

### Date Normalization

| Input Format | Output |
|-------------|--------|
| "1526" | start_date: 1526-01-01, precision: "year" |
| "April 1857" | start_date: 1857-04-01, precision: "month" |
| "1857-1858" | start_date: 1857-01-01, end_date: 1858-12-31 |
| "early 12th century" | start_date: 1100-01-01, precision: "decade" |

### Casualty Normalization

| Input Format | Low | High | Best Estimate |
|-------------|-----|------|---------------|
| "50,000" | 50000 | 50000 | 50000 |
| "20,000-50,000" | 20000 | 50000 | 35000 |
| "tens of thousands" | 10000 | 99000 | 30000 |
| "several hundred" | 200 | 900 | 500 |
| "heavy casualties" | NULL | NULL | NULL (flagged) |

### Entity Resolution

- Normalize empire/kingdom names to canonical forms
- Handle historical vs. modern place names
- Deduplicate events appearing in multiple source pages

---

## Uncertainty Handling

### Uncertainty Categories

1. **Date Uncertainty**
   - `exact`: Known to the day
   - `month`: Known to the month
   - `year`: Known to the year
   - `decade`: Approximate within a decade
   - `century`: Approximate within a century

2. **Casualty Uncertainty**
   - Explicit ranges (low/high)
   - Best estimate calculation
   - Null values for unknown
   - Notes field explaining uncertainty

3. **Location Uncertainty**
   - Point vs. region
   - Modern vs. historical boundaries
   - Multiple locations for large conflicts

### Flagging System

Events are flagged for:
- Highly disputed casualty figures
- Political sensitivity
- Single-source data
- Significant disagreement between sources

---

## Geocoding

### Approach

1. **Modern Place Names**: Nominatim (OpenStreetMap) geocoding
2. **Historical Places**: Manual gazetteer of historical locations
3. **Regions**: Approximate centroid or polygon where available

### Challenges

- Historical place names that no longer exist
- Borders that have changed over centuries
- Events spanning multiple locations

---

## Limitations

### Coverage Gaps

- **Pre-1500 CE**: Limited written records for many regions
- **Local Conflicts**: Small-scale violence often undocumented
- **British Colonial Records**: Potential biases in colonial accounts
- **Partition Era**: Highly contested casualty figures

### Systematic Biases

- English-language source bias
- Better documentation for major empires
- Urban events better recorded than rural
- Recent events better documented than historical

### What This Data Cannot Tell You

- Individual stories and experiences
- Long-term societal effects
- Full context of each event
- Definitive "truth" about disputed events

---

## Ethical Considerations

### Principles

1. **Victim-Centered**: Events are documented to honor memory, not glorify violence
2. **Neutral Presentation**: No favoritism toward any modern nation or group
3. **Uncertainty Transparency**: Always show what we don't know
4. **Source Traceability**: Every data point linked to sources

### Content Warnings

Events involving:
- Genocide or ethnic cleansing
- Sexual violence
- Violence against children
- Graphic descriptions

Are flagged with appropriate content warnings.

### Feedback and Corrections

We welcome corrections, especially from:
- Academic historians
- Descendant communities
- Local experts

Contact: [project contact information]

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2024-12 | Initial data collection methodology |
