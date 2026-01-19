# Embedding & Semantic Search System

## Overview

The grant recommendation system uses **native pgvector** for storing and comparing embeddings, enabling semantic similarity search between projects and grants. Embeddings serve as a **fast pre-filtering stage** before LLM-based analysis.

---

## Why Embeddings?

**Limitations of keyword matching:**
- "Senior wellness program" and "Elderly health initiative" wouldn't match
- Focus area tags like "Health" are too broad

**Embeddings solve this:**
- Capture semantic meaning, not just keywords
- "Senior wellness" and "Elderly health" have high similarity
- Understand context and intent of descriptions

---

## Embedding Model

**Model:** `gemini-embedding-001` (stable)

| Property | Value |
|----------|-------|
| Dimensions | 3072 (default) |
| Input limit | 2,048 tokens |
| Storage | Native pgvector in PostgreSQL |

---

## Data Model

### Grant Embeddings (vector(3072))

| Column | Source Field | Purpose |
|--------|--------------|---------|
| `objectivesEmbed` | `objectives` or `description` | What the grant aims to fund |
| `eligibilityEmbed` | `whoCanApply` | Target applicants |
| `fundingEmbed` | `fundingInfo` | Funding details and conditions |
| `deliverablesEmbed` | `deliverables` or `requiredDocs` | Expected outputs |

### Project Embeddings (vector(3072))

| Column | Source Field | Purpose |
|--------|--------------|---------|
| `goalEmbed` | `description` | Project purpose and activities |
| `populationEmbed` | `targetPopulation` | Who the project serves |
| `outcomesEmbed` | `expectedOutcomes` | Expected impact |
| `deliverablesEmbed` | `deliverables` | Project outputs |

---

## Similarity Calculation

**File:** `src/lib/semantic-comparison.ts`

### Cosine Similarity to Score

Cosine similarity returns values from -1 (opposite) to +1 (identical).
Converted to 0-100 percentage:

```typescript
score = ((cosineSimilarity + 1) / 2) × 100
```

| Similarity | Score | Interpretation |
|------------|-------|----------------|
| +1.0 | 100% | Identical meaning |
| +0.6 | 80% | Strong alignment |
| +0.2 | 60% | Moderate overlap |
| 0.0 | 50% | Neutral / unrelated |
| -0.4 | 30% | Different topics |
| -1.0 | 0% | Opposite meaning |

---

## Section Comparison Mapping

The system compares relevant sections between projects and grants:

```
┌─────────────────────┐      ┌─────────────────────┐
│       PROJECT       │      │        GRANT        │
├─────────────────────┤      ├─────────────────────┤
│ description         │◄────►│ objectives          │  Purpose alignment
│ targetPopulation    │◄────►│ whoCanApply         │  Eligibility fit
│ deliverables        │◄────►│ requiredDocs        │  Output alignment
│ expectedOutcomes    │◄────►│ (derived from desc) │  Impact alignment
└─────────────────────┘      └─────────────────────┘
```

---

## Role in Recommendation Pipeline

Embeddings are used in **Stage 2** of the pipeline:

```
Stage 1: Pre-filter (deadline, status, org type)
    ↓
Stage 2: Embedding + Rules → Top 15 candidates (YOU ARE HERE)
    ↓
Stage 3: LLM scoring → Final rankings
```

### Stage 2 Weight Distribution

**With embeddings available:**
```
prelimScore = (embeddingScore × 0.5) + (categoryScore × 0.3) + 
              (fundingScore × 0.1) + (deadlineScore × 0.1)
```

| Component | Weight | Calculation |
|-----------|--------|-------------|
| Embedding Score | **50%** | Cosine similarity (0-100) |
| Category Match | 30% | Jaccard similarity of focus areas |
| Funding Fit | 10% | Budget range overlap |
| Deadline Urgency | 10% | Days until deadline |

**Rationale for 50% weight:**
- Embeddings capture the *meaning* of project descriptions
- Keyword matching misses semantically similar but differently worded content
- High embedding score strongly indicates genuine purpose alignment

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

## API Response

Embedding scores are included in recommendation responses:
```json
{
  "scores": {
    "semantic": 80,  // Overall embedding similarity (0-100)
    "category": 70,
    "funding": 30,
    "deadline": 20,
    "overall": 75
  }
}
```

---

## Performance Notes

- Embedding generation: ~200ms per text
- Vector comparison: <1ms per grant (pgvector optimized)
- Batch processing: 5 concurrent API calls with 300ms delays

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
| `grants:embed` | Generate embeddings for all grants |
| `db:vector` | Enable pgvector extension |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/embedding-service.ts` | Gemini embedding generation |
| `src/lib/semantic-comparison.ts` | Cosine similarity calculation |
| `src/lib/project-embeddings.ts` | Auto-generate project embeddings |
| `scripts/generate-embeddings.ts` | Batch grant embedding script |
