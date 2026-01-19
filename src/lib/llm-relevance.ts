/**
 * LLM-based Relevance Scoring
 * 
 * Uses Gemini with structured JSON output to analyze project-grant compatibility.
 * This provides more accurate matching than pure embedding similarity.
 */

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// JSON Schema for structured output
const relevanceScoreSchema = {
  type: "object",
  properties: {
    purposeAlignment: {
      type: "number",
      description: "Score 0-100: How well project goals align with grant objectives"
    },
    eligibilityFit: {
      type: "number", 
      description: "Score 0-100: How likely the project meets grant criteria"
    },
    impactRelevance: {
      type: "number",
      description: "Score 0-100: How relevant expected outcomes are to grant goals"
    },
    overall: {
      type: "number",
      description: "Score 0-100: Weighted average of all scores"
    },
    reasoning: {
      type: "string",
      description: "Brief 1-2 sentence explanation of the match quality"
    }
  },
  required: ["purposeAlignment", "eligibilityFit", "impactRelevance", "overall", "reasoning"]
};

export interface LLMRelevanceScore {
  purposeAlignment: number;
  eligibilityFit: number;
  impactRelevance: number;
  overall: number;
  reasoning: string;
}

interface ProjectContext {
  name: string;
  description: string;
  targetPopulation: string;
  focusAreas: string[];
  expectedOutcomes?: string | null;
  deliverables?: string[];
}

interface GrantContext {
  id: string;
  title: string;
  agency: string;
  description: string;
  objectives?: string | null;
  whoCanApply?: string | null;
  fundingInfo?: string | null;
  tags: string[];
}

/**
 * Calculate LLM-based relevance score for a project-grant pair
 */
export async function calculateLLMRelevance(
  project: ProjectContext,
  grant: GrantContext
): Promise<LLMRelevanceScore | null> {
  if (!ai) {
    console.warn("GEMINI_API_KEY not configured, skipping LLM relevance");
    return null;
  }

  const prompt = `You are a strict grant evaluator. Your job is to HONESTLY assess if this project matches this grant.

## Project
**Name:** ${project.name}
**Description:** ${project.description}
**Target Population:** ${project.targetPopulation}
**Focus Areas:** ${project.focusAreas.join(", ")}
**Expected Outcomes:** ${project.expectedOutcomes || "Not specified"}
**Deliverables:** ${project.deliverables?.join(", ") || "Not specified"}

## Grant
**Title:** ${grant.title}
**Agency:** ${grant.agency}
**Description:** ${grant.description}
**Objectives:** ${grant.objectives || "Not specified"}
**Eligibility:** ${grant.whoCanApply || "Not specified"}
**Focus Areas:** ${grant.tags.join(", ")}

## Scoring Instructions (BE STRICT - create meaningful differences)

Score each dimension from 0-100:

### Purpose Alignment
- **0-20**: Completely different purpose (e.g., arts grant for healthcare project)
- **21-40**: Same general sector but different activities (e.g., nursing training vs senior wellness)  
- **41-60**: Related activities with some overlap
- **61-80**: Strong alignment with minor differences
- **81-100**: Near-perfect match in purpose and activities

### Eligibility Fit
- **0-20**: Clearly ineligible (wrong type, size, or sector)
- **21-40**: Probably ineligible, missing key requirements
- **41-60**: Uncertain, may or may not qualify
- **61-80**: Likely eligible with good fit
- **81-100**: Perfect eligibility match

### Impact Relevance  
- **0-20**: Outcomes completely unrelated to grant goals
- **21-40**: Some thematic overlap but different outcomes
- **41-60**: Moderate overlap in expected impact
- **61-80**: Strong outcome alignment
- **81-100**: Outcomes directly serve grant's mission

## Critical Rules
1. A grant for "nursing leadership development" does NOT match a project for "senior community wellness" - these are DIFFERENT activities (score Purpose < 40)
2. Sharing keywords like "community" or "health" is NOT enough for a high score
3. The overall score should be the WEIGHTED AVERAGE: Purpose 50% + Eligibility 25% + Impact 25%
4. Be honest - it's better to give low scores than to overrate mismatched grants`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: relevanceScoreSchema,
        thinkingConfig: {
          thinkingBudget: 0, // Low reasoning
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      console.error("Empty LLM response");
      return null;
    }

    const scores = JSON.parse(responseText) as LLMRelevanceScore;
    
    // Validate and clamp scores
    scores.purposeAlignment = Math.max(0, Math.min(100, Math.round(scores.purposeAlignment)));
    scores.eligibilityFit = Math.max(0, Math.min(100, Math.round(scores.eligibilityFit)));
    scores.impactRelevance = Math.max(0, Math.min(100, Math.round(scores.impactRelevance)));
    scores.overall = Math.max(0, Math.min(100, Math.round(scores.overall)));

    return scores;
  } catch (error) {
    console.error("LLM relevance calculation failed:", error);
    return null;
  }
}

/**
 * Batch calculate LLM relevance for multiple grants
 */
export async function calculateBatchLLMRelevance(
  project: ProjectContext,
  grants: GrantContext[],
  maxConcurrent = 5
): Promise<Map<string, LLMRelevanceScore>> {
  const results = new Map<string, LLMRelevanceScore>();
  
  if (!ai) {
    console.warn("GEMINI_API_KEY not configured");
    return results;
  }

  // Process in batches to avoid rate limits
  for (let i = 0; i < grants.length; i += maxConcurrent) {
    const batch = grants.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(async (grant) => {
      const score = await calculateLLMRelevance(project, grant);
      if (score) {
        results.set(grant.id, score);
      }
    });
    
    await Promise.all(batchPromises);
    
    // Small delay between batches
    if (i + maxConcurrent < grants.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  return results;
}
