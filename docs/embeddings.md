# Embedding & Semantic Search System

## Overview

The grant recommendation system uses **native pgvector** for storing and comparing embeddings, enabling semantic similarity search between projects and grants.

---

## Embedding Model

**Model:** `gemini-embedding-001` (stable, June 2025)
- Input: Text (up to 2,048 tokens)
- Output: 768-dimensional vectors
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

## Updating Embeddings

### Regenerate All Grant Embeddings
To regenerate embeddings (e.g., after model update):
```sql
-- Clear existing embeddings first
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

## Data Model

### Grant Embeddings
| Column | Source Field |
|--------|--------------|
| `objectivesEmbed` | `objectives` or `description` |
| `eligibilityEmbed` | `whoCanApply` |
| `fundingEmbed` | `fundingInfo` |
| `deliverablesEmbed` | `deliverables` or `requiredDocs` |

### Project Embeddings
| Column | Source Field |
|--------|--------------|
| `goalEmbed` | `description` |
| `populationEmbed` | `targetPopulation` |
| `outcomesEmbed` | `expectedOutcomes` |
| `deliverablesEmbed` | `deliverables` |

---

## Semantic Scoring

Weights: **Purpose 40% | Eligibility 40% | Deliverables 20%**

| Score | Project Field | Grant Field |
|-------|--------------|-------------|
| Purpose | `description` | `objectives` |
| Eligibility | `targetPopulation` | `whoCanApply` |
| Deliverables | `deliverables` | `deliverablesEmbed` |

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/projects/[id]/recommend` | Returns `semanticScores` with recommendations |
| `POST /api/projects/[id]/analyze` | AI gap analysis using Gemini |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | For embedding generation and AI analysis |
| `DATABASE_URL` | Yes | PostgreSQL with pgvector |

---

## npm Scripts

| Script | Description |
|--------|-------------|
| `grants:import` | Fetch grants from OurSG API |
| `grants:embed` | Generate embeddings for grants without them |
| `grants:reset` | Clear all grant data |
