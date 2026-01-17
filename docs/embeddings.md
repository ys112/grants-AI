# Embedding & Semantic Search System

## Overview

The grant recommendation system uses **native pgvector** for storing and comparing embeddings, enabling semantic similarity search between projects and grants. Embeddings serve as a **pre-filtering stage** before LLM-based analysis.

---

## Embedding Model

**Model:** `gemini-embedding-001` (stable)
- Input: Text (up to 2,048 tokens)
- Output: 3072-dimensional vectors (default)
- Supports: 128 - 3,072 dimensions

---

## Setup Steps

### 1. Enable pgvector (one-time)
Run in Neon SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Push schema
```bash
npx prisma db push
npx prisma generate
```

### 3. Generate grant embeddings
```bash
npm run grants:embed
```

### 4. Project embeddings
Generated automatically on create/update via API.

---

## Data Model

### Grant Embeddings (vector(3072))
| Column | Source Field |
|--------|--------------|
| `objectivesEmbed` | `objectives` or `description` |
| `eligibilityEmbed` | `whoCanApply` |
| `fundingEmbed` | `fundingInfo` |
| `deliverablesEmbed` | `deliverables` or `requiredDocs` |

### Project Embeddings (vector(3072))
| Column | Source Field |
|--------|--------------|
| `goalEmbed` | `description` |
| `populationEmbed` | `targetPopulation` |
| `outcomesEmbed` | `expectedOutcomes` |
| `deliverablesEmbed` | `deliverables` |

---

## Similarity Calculation

**File:** `src/lib/semantic-comparison.ts`

Uses **cosine similarity** converted to percentage scores:
```typescript
score = ((similarity + 1) / 2) * 100  // Maps -1..1 to 0..100
```

### Section Weights (Pre-filter stage)
When embeddings are available:
- 50% Embedding Score
- 30% Category Match
- 10% Funding Fit
- 10% Deadline Urgency

---

## Role in Recommendation Pipeline

Embeddings serve as **Stage 2** of the pipeline:

1. **Stage 1:** Pre-filter (deadline, status, org type)
2. **Stage 2:** Embedding + rules → Top 15 candidates
3. **Stage 3:** LLM scoring → Final top 10

See `docs/recommendation-engine.md` for full pipeline details.

---

## Updating Embeddings

### Regenerate All Grant Embeddings
```sql
-- Clear existing embeddings
UPDATE "Grant" SET 
  "objectivesEmbed" = NULL,
  "eligibilityEmbed" = NULL,
  "fundingEmbed" = NULL,
  "deliverablesEmbed" = NULL;
```
Then run:
```bash
npm run grants:embed
```

### Regenerate Project Embeddings
Edit and save the project - embeddings regenerate automatically.

---

## API Usage

Embedding scores are included in recommendation responses:
```json
{
  "scores": {
    "semantic": 80,  // Overall embedding similarity
    ...
  }
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | For embedding generation |
| `DATABASE_URL` | Yes | PostgreSQL with pgvector |

---

## npm Scripts

| Script | Description |
|--------|-------------|
| `grants:embed` | Generate embeddings for grants |
| `db:vector` | Enable pgvector extension |
