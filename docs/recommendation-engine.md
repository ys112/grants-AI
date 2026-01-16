# Grant Recommendation Engine

A multi-stage pipeline for matching organizational projects to relevant grants from the OurSG Grants Portal.

---

## Overview

The recommendation engine helps non-profit organizations discover grant opportunities that align with their specific projects. Instead of manually searching through hundreds of grants, organizations define their project criteria and receive ranked recommendations with match scores and explanations.

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INPUT: Project Definition                     │
│  - Name, Description, Focus Areas, Target Population, Funding Needs │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     STAGE 1: Pre-Filter (Eligibility)                │
│  Remove grants that are:                                             │
│  - Past deadline (deadline < today)                                  │
│  - Not open (status ≠ "green")                                       │
│  - Not available to organizations (applicableTo ∌ "organisation")    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     STAGE 2: Category Match (50%)                    │
│  Jaccard Similarity between project focus areas and grant tags       │
│  Score = |Intersection| / |Union| × 100 + Overlap Bonus              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     STAGE 3: Funding Match (30%)                     │
│  Range overlap between project funding needs and grant amount        │
│  Bonus for perfect fit (grant fully covers project needs)            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     STAGE 4: Deadline Urgency (20%)                  │
│  Urgency scoring based on days until deadline                        │
│  ≤7 days = 100, ≤14 = 80, ≤30 = 60, ≤60 = 40, ≤90 = 30, >90 = 20    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     STAGE 5: Composite Scoring                       │
│  Overall = (Category × 0.50) + (Funding × 0.30) + (Deadline × 0.20) │
│  Filter by minimum score threshold (default: 30)                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     STAGE 6: Match Reason Generation                 │
│  Human-readable explanation of why this grant matches                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        OUTPUT: Ranked Recommendations                │
│  Sorted by overall score, limited to maxResults (default: 10)        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stage Details

### Stage 1: Pre-Filter (Eligibility Check)

**Purpose:** Eliminate grants that cannot possibly be applied for.

**Filters Applied:**
| Filter | Field | Condition | Reason |
|--------|-------|-----------|--------|
| Deadline | `deadline` | `>= today` | Expired grants are useless |
| Status | `status` | `= "green"` | Only open grants can be applied to |
| Applicability | `applicableTo` | Contains `"organisation"` | Individual-only grants are irrelevant |

**SQL Equivalent:**
```sql
SELECT * FROM grants
WHERE deadline >= CURRENT_DATE
  AND status = 'green'
  AND applicableTo LIKE '%organisation%'
```

---

### Stage 2: Category Match Score (Weight: 50%)

**Purpose:** Measure how well the grant's focus areas align with the project's focus areas.

**Algorithm: Jaccard Similarity**

The Jaccard similarity coefficient measures overlap between two sets:

```
J(A, B) = |A ∩ B| / |A ∪ B|
```

Where:
- A = Project focus areas (e.g., {"Health", "Care", "Social Service"})
- B = Grant tags/categories (e.g., {"Health", "Community", "Seniors"})

**Example:**
```
Project: {"Health", "Care", "Social Service"}
Grant:   {"Health", "Community", "Seniors"}

Intersection: {"Health"} → size 1
Union: {"Health", "Care", "Social Service", "Community", "Seniors"} → size 5

Jaccard = 1/5 = 0.20 = 20%
```

**Overlap Bonus:** +20 points if there's ANY intersection (to avoid over-penalizing partial matches)

**Final Score:** `min(100, Jaccard × 100 + OverlapBonus)`

**Why Jaccard?**
- Simple and interpretable
- Handles sets of different sizes fairly
- Doesn't require training data

---

### Stage 3: Funding Match Score (Weight: 30%)

**Purpose:** Ensure the grant's funding amount aligns with the project's needs.

**Algorithm: Range Overlap**

```
Project needs: $50,000 - $150,000
Grant offers:  $30,000 - $100,000

Overlap: max(50k, 30k) to min(150k, 100k) = $50,000 - $100,000
Overlap size: $50,000
Project range: $100,000

Score = (Overlap / Project Range) × 100 = 50%
```

**Special Cases:**

| Scenario | Score | Reason |
|----------|-------|--------|
| No project funding specified | 50 | Neutral - all grants could work |
| No grant amount info | 30 | Unknown but might work |
| No overlap | 0 | Grant can't meet needs |
| Grant fully covers project | +20 bonus | Perfect fit |

**Why Range Overlap?**
- Organizations often have minimum funding needs
- Overly large grants may have requirements the org can't meet
- Partial overlap is still valuable

---

### Stage 4: Deadline Urgency Score (Weight: 20%)

**Purpose:** Prioritize grants with approaching deadlines to prevent missed opportunities.

**Scoring Table:**
| Days Until Deadline | Score | Urgency Level |
|---------------------|-------|---------------|
| ≤ 7 days | 100 | 🔴 Critical |
| 8-14 days | 80 | 🟠 High |
| 15-30 days | 60 | 🟡 Medium |
| 31-60 days | 40 | 🟢 Normal |
| 61-90 days | 30 | 🔵 Low |
| > 90 days | 20 | ⚪ Minimal |

**Why Include Urgency?**
- Prevents the "I found a perfect grant but the deadline was yesterday" problem
- Surfaces time-sensitive opportunities
- Acts as a tiebreaker between similar matches

**Why Only 20% Weight?**
- Relevance (category + funding) should dominate
- A bad-fit grant with a close deadline shouldn't rank high
- Urgency is a boost, not a primary factor

---

### Stage 5: Composite Score Calculation

**Formula:**
```
Overall = (Category × 0.50) + (Funding × 0.30) + (Deadline × 0.20)
```

**Weight Rationale:**

| Factor | Weight | Rationale |
|--------|--------|-----------|
| Category Match | 50% | Focus area alignment is the primary indicator of relevance |
| Funding Match | 30% | Funding fit is important but secondary to purpose alignment |
| Deadline Urgency | 20% | Time-sensitivity matters but shouldn't override relevance |

**Threshold:** Only recommendations with `Overall ≥ 30` are returned (configurable via `minScore` parameter).

---

### Stage 6: Match Reason Generation

**Purpose:** Provide human-readable explanations so users understand WHY a grant was recommended.

**Reason Components:**

1. **Focus Area Matches:** Lists overlapping areas
   - "Matches your focus areas: Health, Care"

2. **Funding Alignment:** Based on funding score
   - ≥80: "Funding range aligns well with your project needs"
   - ≥50: "Funding range partially overlaps with your requirements"

3. **Agency Context:** Include the funding agency
   - "Offered by Agency for Integrated Care"

4. **Deadline Warning:** If closing soon
   - "Deadline approaching in 5 days"

---

## Caching Strategy

To avoid redundant calculations, recommendations are cached in the database.

**Cache Invalidation Triggers:**
1. **New grants added:** If `Grant.createdAt > cache timestamp`
2. **Project updated:** If `Project.updatedAt > cache timestamp`
3. **Manual refresh:** User clicks "Refresh Recommendations"

**Cache Check Query:**
```sql
-- Check if cache is stale
SELECT COUNT(*) FROM grants
WHERE createdAt > :cacheDate
  AND status = 'green'
  AND applicableTo LIKE '%organisation%'
  AND deadline >= CURRENT_DATE
```

If count > 0 OR project was updated → regenerate recommendations.

---

## API Usage

### Generate Recommendations
```http
POST /api/projects/{projectId}/recommend
Content-Type: application/json

{
  "maxResults": 10,      // Optional: max grants to return
  "minScore": 30,        // Optional: minimum score threshold
  "forceRefresh": false  // Optional: bypass cache
}
```

### Response
```json
{
  "project": { "id": "...", "name": "..." },
  "recommendations": [
    {
      "grant": {
        "id": "...",
        "title": "Community Care Grant",
        "agency": "AIC",
        "amount": "$50,000 - $100,000",
        "deadline": "2024-03-31"
      },
      "scores": {
        "overall": 85.2,
        "category": 90,
        "funding": 75,
        "deadline": 60
      },
      "matchReason": "Matches your focus areas: Health, Care. Funding range aligns well."
    }
  ],
  "meta": {
    "totalMatches": 8,
    "cached": true,
    "cachedAt": "2024-01-16T12:00:00Z"
  }
}
```

---

## Future Enhancements

### Planned: Semantic Similarity with Embeddings

Add a 4th scoring dimension using text embeddings:

1. Create embeddings for grant descriptions
2. Create embedding for project description
3. Calculate cosine similarity
4. Add to composite score (e.g., 20% weight, reduce others)

**Fingerprint Structure:**
```
Purpose: {description}
Deliverables: {deliverables}
For: {target population}
Outcomes: {expected KPIs}
```

### Planned: Proactive Alerts

Email notifications when new grants match existing projects:
- Nightly job: check for new grants
- For each new grant, score against all active projects
- Send email if score > threshold

---

## Database Schema

```prisma
model Project {
  id                String   @id
  userId            String
  name              String
  description       String
  targetPopulation  String   // seniors, youth, disabled, low-income, general
  focusAreas        String   // JSON: ["Health", "Care"]
  deliverables      String?  // JSON: ["Workshop", "Research"]
  fundingMin        Int?
  fundingMax        Int?
  status            String   @default("planning")
  priority          String   @default("medium")
  
  recommendations   ProjectRecommendation[]
}

model ProjectRecommendation {
  id            String   @id
  projectId     String
  grantId       String
  overallScore  Float
  categoryScore Float?
  fundingScore  Float?
  matchReason   String?
  status        String   @default("new") // new, reviewed, applied, dismissed
  
  @@unique([projectId, grantId])
}
```

---

## References

- [Jaccard Similarity](https://en.wikipedia.org/wiki/Jaccard_index)
- [OurSG Grants Portal](https://oursggrants.gov.sg/)
- [Tsao Foundation Problem Statement](../tsao%20problem%20statement%20+%20qna.docx)
