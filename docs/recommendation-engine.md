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
│  All Grants ─▶ Eligible ─▶ Top 20 Candidates ─▶ Final Rankings │
│  (~100+)       (~40)       (embedding+rules)    (LLM analyzed)  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Pre-Filtering

**File:** `src/lib/recommendation-engine.ts`

Filters grants based on eligibility criteria:
- ✅ Deadline not passed
- ✅ Status is "green" (open for applications)
- ✅ Applicable to organisations

**Rationale:** Eliminates clearly ineligible grants before expensive scoring computations.

---

## Stage 2: Preliminary Scoring (Embedding + Rules)

**Files:** 
- `src/lib/recommendation-engine.ts`
- `src/lib/semantic-comparison.ts`
- `src/lib/embedding-service.ts`

### Preliminary Scoring Formula

**With embeddings available:**
```
prelimScore = (embeddingScore × 0.5) + (categoryScore × 0.3) + 
              (fundingScore × 0.1) + (deadlineScore × 0.1)
```

**Without embeddings (fallback):**
```
prelimScore = (categoryScore × 0.5) + (fundingScore × 0.3) + (deadlineScore × 0.2)
```

### Weight Rationale

| Score Component | Weight | Rationale |
|-----------------|--------|-----------|
| **Embedding Score** | 50% | Captures semantic meaning beyond keywords - understands project intent |
| **Category Match** | 30% | Focus area alignment is critical for grant eligibility |
| **Funding Fit** | 10% | Budget alignment matters but is often flexible |
| **Deadline Urgency** | 10% | Prioritizes actionable grants but shouldn't dominate |

---

## Score Calculation Details

### 1. Category Match Score (0-100)

**Source:** `calculateCategoryScore()` in recommendation-engine.ts

Uses **Jaccard similarity** to compare project focus areas with grant tags:

```typescript
// Example: Project has ["Health", "Community", "Seniors"]
// Grant has ["Health", "Education", "Community"]
// Intersection: ["Health", "Community"] = 2
// Union: ["Health", "Community", "Seniors", "Education"] = 4
// Jaccard: 2/4 = 0.5 → 50%
// Overlap bonus: +20% (any match gets bonus)
// Final: 70%

jaccardScore = (intersection.size / union.size) × 100
overlapBonus = intersection.size > 0 ? 20 : 0
categoryScore = min(100, jaccardScore + overlapBonus)
```

**Rationale:** Jaccard similarity handles varying list sizes fairly; overlap bonus ensures partial matches aren't penalized too harshly.

---

### 2. Funding Fit Score (0-100)

**Source:** `calculateFundingScore()` in recommendation-engine.ts

Uses **"up to max"** logic - project specifies maximum budget needed, and grants that can provide that amount or more are a perfect fit:

| Scenario | Score |
|----------|-------|
| Grant provides ≥ project budget | 100% (perfect fit) |
| Grant provides partial amount | Proportional (e.g. $50k/$100k = 50%) |
| Grant has "Varies" / unknown amount | 30% (might work) |
| No project budget specified | 50% (neutral) |

```typescript
// Example: Project needs up to $50,000
// Grant offers $200,000 → Score: 100% (can fully cover)
// Grant offers $25,000 → Score: 50% (covers half)
// Grant offers "Varies" → Score: 30% (unknown)
```

**Rationale:** Projects need "up to X" amount - any grant that can fully fund the project is a perfect match. Partial funding still has value.

---

### 3. Deadline Urgency Score (0-100)

**Source:** `calculateDeadlineScore()` in recommendation-engine.ts

Prioritizes grants with approaching deadlines (more actionable):

| Days Until Deadline | Score | Urgency Level |
|---------------------|-------|---------------|
| ≤ 7 days | 100% | 🔴 Very urgent |
| 8-14 days | 80% | 🟠 Urgent |
| 15-30 days | 60% | 🟡 Moderate |
| 31-60 days | 40% | 🟢 Planning |
| 61-90 days | 30% | ⚪ Future |
| > 90 days | 20% | ⚪ Long-term |

**Rationale:** Urgent grants need immediate attention but shouldn't overwhelm long-term planning.

---

### 4. Embedding Semantic Score (0-100)

**Source:** `src/lib/semantic-comparison.ts`

Uses **cosine similarity** between vector embeddings to measure conceptual alignment:

```typescript
// Cosine similarity returns -1 to +1
// Convert to 0-100 scale:
score = ((cosineSimilarity + 1) / 2) × 100
```

**Section Comparisons:**
| Project Field | Grant Field | Purpose |
|--------------|-------------|---------|
| `description` | `objectives` | Purpose alignment |
| `targetPopulation` | `whoCanApply` | Eligibility fit |
| `deliverables` | `requiredDocs` | Output alignment |

**Rationale:** Embeddings capture semantic meaning beyond keyword matching - "elderly wellness" and "senior health" score highly even without exact word matches.

---

## Stage 3: LLM-Based Relevance Scoring

**File:** `src/lib/llm-relevance.ts`

The top 15 candidates from Stage 2 are analyzed by **Gemini 3 Flash** with structured JSON output.

### LLM Configuration
```typescript
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseJsonSchema: relevanceScoreSchema,
    thinkingConfig: { thinkingBudget: 0 }, // Low reasoning for speed
  },
});
```

### LLM Scoring Dimensions

| Score | Weight in LLM Overall | Description |
|-------|----------------------|-------------|
| **purposeAlignment** | 50% | Do project activities align with grant objectives? |
| **eligibilityFit** | 25% | Would project/org qualify for this grant? |
| **impactRelevance** | 25% | Do expected outcomes serve grant mission? |

### LLM Score Rubric

The LLM is instructed with explicit scoring guidelines:

**Purpose Alignment:**
- 0-20: Completely different purpose (e.g., arts grant for healthcare project)
- 21-40: Same sector but different activities (nursing training vs senior wellness)
- 41-60: Related activities with some overlap
- 61-80: Strong alignment with minor differences
- 81-100: Near-perfect match in purpose and activities

**Eligibility Fit:**
- 0-20: Clearly ineligible
- 21-40: Probably ineligible, missing key requirements
- 41-60: Uncertain eligibility
- 61-80: Likely eligible with good fit
- 81-100: Perfect eligibility match

**Impact Relevance:**
- 0-20: Outcomes completely unrelated to grant goals
- 21-40: Some thematic overlap but different outcomes
- 41-60: Moderate overlap in expected impact
- 61-80: Strong outcome alignment
- 81-100: Outcomes directly serve grant's mission

---

## Final Score Calculation

**The final overall score blends LLM and rule-based scores:**

```
finalScore = (LLM_overall × 0.6) + (prelimScore × 0.4)
```

| Component | Weight | Rationale |
|-----------|--------|-----------|
| **LLM Score** | 60% | AI understands nuanced alignment better than rules |
| **Preliminary Score** | 40% | Rules catch objective factors LLM might miss (funding, deadline) |

**Fallback:** If LLM scoring fails for a grant, uses `prelimScore` only.

---

## Data Caching

### What Gets Cached (in `ProjectRecommendation` table)

| Field | Description |
|-------|-------------|
| `overallScore` | Final blended score |
| `categoryScore` | Focus area match |
| `fundingScore` | Budget alignment |
| `semanticScore` | Embedding similarity |
| `deadlineScore` | Urgency score |
| `llmPurpose` | LLM purpose alignment (0-100) |
| `llmEligibility` | LLM eligibility fit (0-100) |
| `llmImpact` | LLM impact relevance (0-100) |
| `llmOverall` | LLM composite score (0-100) |
| `matchReason` | LLM reasoning text |

### Cache Invalidation

Cache is invalidated when:
- Project is updated
- New grants are added to the database

---

## API Endpoints

### Generate Recommendations
```http
POST /api/projects/{id}/recommend
Content-Type: application/json

{
  "maxResults": 20,
  "minScore": 30,
  "forceRefresh": true
}
```

### Get Cached Recommendations
```http
GET /api/projects/{id}/recommend
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

## Performance Considerations

### Rate Limiting
- LLM calls are batched (5 concurrent)
- 300ms delay between batches
- Only top 15 candidates analyzed by LLM (not all grants)

### Caching
- All scores (including LLM) cached in database
- First load shows cached data instantly
- Click "Refresh" to regenerate with fresh LLM analysis

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | For embeddings + LLM scoring |
| `DATABASE_URL` | Yes | PostgreSQL with pgvector enabled |

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
2. Click "Refresh" to regenerate recommendations
3. Check browser console for API errors

### Embeddings Not Working
1. Ensure pgvector is enabled: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Run `npm run grants:embed` for grant embeddings
3. Edit and save project to regenerate project embeddings

### All Funding Scores Same (30%)
- This means grants have "Varies" as amount (null min/max)
- 30% is the "unknown funding - might work" default score
