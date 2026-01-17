# Recommendation Engine Documentation

## Overview

The GrantSync recommendation system uses a **2-stage hybrid pipeline** combining:
1. **Embedding-based pre-filtering** (fast, broad filtering)
2. **LLM-based relevance scoring** (accurate, reasoning-based analysis)

This approach provides both speed and accuracy - quickly filtering thousands of grants, then using AI to deeply analyze the top candidates.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECOMMENDATION PIPELINE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Stage 1    │    │   Stage 2    │    │   Stage 3    │       │
│  │  Pre-Filter  │───▶│  Embedding   │───▶│ LLM Scoring  │       │
│  │              │    │   + Rules    │    │              │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
│  All Grants ─▶ Eligible ─▶ Top 15 Candidates ─▶ Top 10 Final   │
│  (~100+)       (~40)       (embedding+rules)    (LLM analyzed)  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Pre-Filtering

**File:** `src/lib/recommendation-engine.ts`

Filters grants based on eligibility criteria:
- Deadline not passed
- Status is "green" (open for applications)
- Applicable to organisations

---

## Stage 2: Embedding + Rule-Based Scoring

**Files:** 
- `src/lib/recommendation-engine.ts`
- `src/lib/semantic-comparison.ts`
- `src/lib/embedding-service.ts`

### Preliminary Scoring Formula

**With embeddings available:**
- 50% Embedding Semantic Score
- 30% Category Match
- 10% Funding Fit
- 10% Deadline Urgency

**Without embeddings (fallback):**
- 50% Category Match
- 30% Funding Fit
- 20% Deadline Urgency

### Embedding Model
- **Model:** `gemini-embedding-001`
- **Dimensions:** 3072
- **Storage:** Native pgvector in Neon PostgreSQL

### What Gets Compared

| Project Field | Grant Field | Comparison |
|--------------|-------------|------------|
| `description` | `objectives` | Purpose alignment |
| `targetPopulation` | `whoCanApply` | Eligibility fit |
| `deliverables` | `requiredDocs` | Deliverables match |

---

## Stage 3: LLM-Based Relevance Scoring

**File:** `src/lib/llm-relevance.ts`

The top 15 candidates from Stage 2 are analyzed by **Gemini 3.0 Flash** with structured JSON output.

### LLM Configuration
```typescript
const response = await ai.models.generateContent({
  model: "gemini-3.0-flash",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseJsonSchema: relevanceScoreSchema,
    thinkingConfig: { thinkingBudget: 0 }, // Low reasoning for speed
  },
});
```

### Scoring Dimensions

| Score | Range | Description |
|-------|-------|-------------|
| **purposeAlignment** | 0-100 | Do project goals align with grant objectives? |
| **eligibilityFit** | 0-100 | Would project qualify for this grant? |
| **impactRelevance** | 0-100 | Do expected outcomes match grant goals? |
| **overall** | 0-100 | Weighted composite score |
| **reasoning** | text | 1-2 sentence explanation |

### Strict Scoring Guidelines

The LLM is instructed to be **strict**:
- A grant for "nursing leadership training" does NOT match "senior health education" just because both mention seniors
- Low scores (0-30) for fundamental mismatches
- Medium scores (40-60) for partial alignment
- High scores (70-100) only for genuine alignment

---

## API Endpoints

### Generate Recommendations
```http
POST /api/projects/{id}/recommend
Content-Type: application/json

{
  "maxResults": 10,
  "minScore": 30,
  "forceRefresh": false
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "grant": { "id", "title", "agency", "amount", "deadline" },
      "scores": {
        "overall": 75,
        "category": 87,
        "funding": 30,
        "deadline": 20,
        "semantic": 80
      },
      "llmScores": {
        "purposeAlignment": 82,
        "eligibilityFit": 70,
        "impactRelevance": 65,
        "overall": 75,
        "reasoning": "Project focuses on senior health education which aligns..."
      },
      "matchReason": "Strong purpose alignment with community care focus..."
    }
  ],
  "meta": { "totalMatches": 10, "cached": false }
}
```

### Enhance Recommendations (Standalone LLM)
```http
POST /api/projects/{id}/recommend/enhance
Content-Type: application/json

{
  "grantIds": ["id1", "id2", "id3"]
}
```

### AI Gap Analysis
```http
POST /api/projects/{id}/analyze
Content-Type: application/json

{
  "grantId": "grant-id"
}
```

---

## Embedding System

### Database Columns (pgvector)

**Grant Table:**
| Column | Type | Source |
|--------|------|--------|
| `objectivesEmbed` | vector(3072) | `objectives` or `description` |
| `eligibilityEmbed` | vector(3072) | `whoCanApply` |
| `fundingEmbed` | vector(3072) | `fundingInfo` |
| `deliverablesEmbed` | vector(3072) | `deliverables` or `requiredDocs` |

**Project Table:**
| Column | Type | Source |
|--------|------|--------|
| `goalEmbed` | vector(3072) | `description` |
| `populationEmbed` | vector(3072) | `targetPopulation` |
| `outcomesEmbed` | vector(3072) | `expectedOutcomes` |
| `deliverablesEmbed` | vector(3072) | `deliverables` |

### Generating Embeddings

**Grant embeddings (batch):**
```bash
npm run grants:embed
```

**Project embeddings (automatic):**
- Generated on project create via API
- Regenerated on project update if content fields change

---

## Performance Considerations

### Rate Limiting
- LLM calls are batched (5 concurrent)
- 300ms delay between batches
- Only top 15 candidates analyzed by LLM (not all grants)

### Caching
- Recommendations cached in database
- Cache invalidated when:
  - Project is updated
  - New grants are added
- Semantic scores calculated fresh even for cached recommendations

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | For embeddings + LLM scoring |
| `DATABASE_URL` | Yes | PostgreSQL with pgvector enabled |

---

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run grants:import` | Fetch grants from OurSG API |
| `npm run grants:embed` | Generate embeddings for grants |
| `npm run grants:reset` | Clear all grant data |
| `npm run db:vector` | Enable pgvector extension |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/recommendation-engine.ts` | Main 2-stage pipeline |
| `src/lib/llm-relevance.ts` | Gemini LLM scoring with JSON schema |
| `src/lib/semantic-comparison.ts` | Embedding similarity calculation |
| `src/lib/embedding-service.ts` | Gemini embedding generation |
| `src/lib/project-embeddings.ts` | Auto-generate project embeddings |
| `src/components/RecommendationCard.tsx` | Display scores + LLM analysis |

---

## Troubleshooting

### LLM Scores Not Showing
1. Check `GEMINI_API_KEY` is set
2. Click "Update" to force fresh recommendations
3. Check browser console for API errors

### Embeddings Not Working
1. Ensure pgvector is enabled: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Run `npm run grants:embed` for grant embeddings
3. Edit and save project to regenerate project embeddings

### All Funding Scores Same (30%)
- This means grants have "Varies" as amount (null min/max)
- 30% is the "unknown funding - might work" default score
