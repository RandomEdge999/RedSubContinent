# Red SubContinent

A data-rich, interactive historical visualization of South Asian conflicts, invasions, famines, and major violent events from **1000 CE to the present**.

Inspired by [Fallen.io](http://fallen.io), this project aims to create a serious, educational, and ethically responsible way to explore this history.

## ⚠️ Content Warning

This project documents historical violence, including wars, massacres, famines, and other tragic events. The content is intended for educational purposes and is presented with respect for all victims and their descendants.

## Features

### Three Main Views

1. **Story Mode** - A scroll-driven cinematic narrative that walks you through South Asian history with animated maps and charts
2. **Explorer Mode** - An interactive map with time slider, filters, and detailed event views
3. **Data Mode** - Tables, charts, methodology documentation, and CSV export

### Data Principles

- Source-driven with explicit uncertainty
- Low/high/best casualty estimates
- Full source citations for every event
- Neutral, non-political presentation

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, TanStack Query |
| Maps | MapLibre GL JS |
| Charts | D3.js |
| Animations | Framer Motion |
| Backend | FastAPI, Python 3.11+ |
| Database | PostgreSQL 16 with PostGIS |
| ORM | SQLAlchemy 2.0, Alembic |
| ETL | Python (pandas, BeautifulSoup4, Pydantic) |

## Project Structure

```
RedSubContinent/
├── etl/                 # Python ETL pipeline (data scraping/cleaning)
├── api/                 # FastAPI backend
├── web/                 # Next.js frontend
├── infra/               # Docker and deployment configs
├── docker-compose.yml   # Local development orchestration
└── METHODS.md           # Data methodology documentation
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for ETL/API development)

### Development Setup

1. **Clone and configure environment**
   ```bash
   git clone <repository-url>
   cd RedSubContinent
   cp .env.example .env
   ```

2. **Start all services with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Individual Service Development

**ETL Pipeline:**
```bash
cd etl
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python scripts/run_scrape.py
```

**API Server:**
```bash
cd api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd web
npm install
npm run dev
```

## Data Sources

See [METHODS.md](./METHODS.md) for complete documentation on:
- Data collection methodology
- Source reliability assessment
- Uncertainty handling
- Known limitations

### Primary Sources
- Wikipedia "List of wars" and conflict pages
- Correlates of War dataset
- Academic historical databases

## Contributing

This project welcomes contributions, especially:
- Additional historical data sources
- Improved casualty estimates with citations
- Historical boundary GeoJSON data
- Accessibility improvements
- Translations

## License

MIT License - See [LICENSE](./LICENSE) for details.

## Acknowledgments

- Inspired by Neil Halloran's [Fallen.io](http://fallen.io)
- Built with respect for the memories of all those affected by these historical events
