# GrantSync v2 - Data Pipeline Roadmap

## Phase 1: OurSG Grants Scraper ✅ COMPLETE

### Completed Tasks

- [x] **Python Scraper** - `scripts/scraper.py`
  - BeautifulSoup-based scraper with fallback to sample data
  - Issue area detection from text
  - Funding amount parsing (min/max)
  - Deadline parsing
  
- [x] **Database Schema** - Updated Grant model with:
  - `eligibilityCriteria` (JSON array)
  - `kpis` (JSON array)
  - `issueArea`, `sourceId`, `scrapedAt`
  
- [x] **Import Script** - `scripts/import_grants.ts`
  - Reads from `data/grants.json`
  - Deduplication support
  - 10 grants imported successfully

### Usage
```bash
npm run scrape         # Run Python scraper
npm run import         # Import JSON to database
npm run refresh-grants # Scrape + import in one command
```

---

## Phase 2: Enhanced Filtering UI (Next)

### Tasks
- [ ] Funding range slider component
- [ ] Deadline date picker filter
- [ ] Issue area multi-select
- [ ] Eligibility checkboxes
- [ ] API endpoint with filter params
- [ ] Save user filter preferences

---

## Phase 3: Recommendation Engine

### Tasks
- [ ] Organization mission statement field
- [ ] Text similarity scoring
- [ ] Weighted criteria matching
- [ ] Vector embeddings (optional)
