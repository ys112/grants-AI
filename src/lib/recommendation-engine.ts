/**
 * Grant Recommendation Engine
 * 
 * Multi-stage pipeline for matching projects to grants:
 * 1. Pre-filter: Eliminate ineligible grants (closed, wrong type)
 * 2. Category match: Score based on focus area overlap
 * 3. Funding match: Score based on funding range overlap
 * 4. Semantic match: AI embedding similarity (when available)
 * 5. Composite scoring: Weighted combination of all scores
 */

import { prisma } from "@/lib/prisma";
import { calculateBatchSemanticSimilarity, type SectionSimilarityScores } from "@/lib/semantic-comparison";
import type { Grant as PrismaGrant, Project as PrismaProject } from "@/generated/prisma";

// Types for the recommendation engine
export interface RecommendationResult {
  grant: PrismaGrant;
  scores: {
    overall: number;
    category: number;
    funding: number;
    deadline: number;
    semantic?: number | null;
  };
  llmScores?: {
    purposeAlignment: number;
    eligibilityFit: number;
    impactRelevance: number;
    overall: number;
    reasoning: string;
  } | null;
  matchReason?: string;
}

export interface RecommendationOptions {
  maxResults?: number;
  minScore?: number;
  includeReasoning?: boolean;
}

// Available focus areas/categories (aligned with grant data)
export const FOCUS_AREAS = [
  "Arts",
  "Care",
  "Community",
  "Digital Skills/Tools",
  "Education/Learning",
  "Engagement Marketing",
  "Environment",
  "Health",
  "Heritage",
  "Social Cohesion",
  "Social Service",
  "Sport",
  "Youth",
] as const;

// Target populations
export const TARGET_POPULATIONS = [
  "seniors",
  "youth",
  "disabled",
  "low-income",
  "general",
] as const;

// Deliverable types (aligned with grant data)
export const DELIVERABLES = [
  "Classes/Seminar/Workshop",
  "Dialogue/Conversation",
  "Event/Exhibition/Performance",
  "Fund-Raising",
  "Music/Video",
  "Publication",
  "Research/Documentation/Prototype",
  "Visual Arts",
  "Apps/Social Media/Website",
] as const;

/**
 * Main recommendation function
 */
export async function getRecommendationsForProject(
  project: PrismaProject,
  options: RecommendationOptions = {}
): Promise<RecommendationResult[]> {
  const { maxResults = 10, minScore = 30 } = options;

  // Parse project focus areas
  const projectFocusAreas: string[] = JSON.parse(project.focusAreas || "[]");
  const projectDeliverables: string[] = JSON.parse(project.deliverables || "[]");

  // Stage 1: Pre-filter - Get eligible grants
  // Filter: deadline not passed, status green, applicable to organisation
  const eligibleGrants = await prisma.grant.findMany({
    where: {
      deadline: { gte: new Date() },     // Not expired
      status: "green",                    // Open for applications
      applicableTo: { contains: "organisation" }, // Applicable to orgs
    },
  });

  // Stage 2: Calculate preliminary scores (embedding + category) for pre-filtering
  const grantIds = eligibleGrants.map(g => g.id);
  const semanticScoresMap = await calculateBatchSemanticSimilarity(project.id, grantIds);

  // Score all grants with preliminary scoring
  type PreliminaryResult = {
    grant: PrismaGrant;
    prelimScore: number;
    categoryScore: number;
    fundingScore: number;
    deadlineScore: number;
    embeddingScore: number | null;
    grantTags: string[];
  };

  const preliminaryScores: PreliminaryResult[] = [];

  for (const grant of eligibleGrants) {
    const grantTags: string[] = JSON.parse(grant.tags || "[]");
    const categoryScore = calculateCategoryScore(projectFocusAreas, grantTags);
    const fundingScore = calculateFundingScore(
      project.fundingMin,
      project.fundingMax,
      grant.amountMin,
      grant.amountMax
    );
    const deadlineScore = calculateDeadlineScore(grant.deadline);
    const embeddingScore = semanticScoresMap.get(grant.id)?.overall ?? null;

    // Preliminary score: category + embedding weighted (no LLM yet)
    const prelimScore = embeddingScore !== null
      ? (embeddingScore * 0.5) + (categoryScore * 0.3) + (fundingScore * 0.1) + (deadlineScore * 0.1)
      : (categoryScore * 0.5) + (fundingScore * 0.3) + (deadlineScore * 0.2);

    if (prelimScore >= minScore * 0.7) { // Lower threshold for pre-filter
      preliminaryScores.push({
        grant,
        prelimScore,
        categoryScore,
        fundingScore,
        deadlineScore,
        embeddingScore,
        grantTags,
      });
    }
  }

  // Sort by preliminary score and take top 15 for LLM scoring
  preliminaryScores.sort((a, b) => b.prelimScore - a.prelimScore);
  const topCandidates = preliminaryScores.slice(0, 15);

  // Stage 3: LLM re-scoring for top candidates
  const { calculateBatchLLMRelevance } = await import("@/lib/llm-relevance");
  
  const projectContext = {
    name: project.name,
    description: project.description,
    targetPopulation: project.targetPopulation,
    focusAreas: projectFocusAreas,
    expectedOutcomes: project.expectedOutcomes,
    deliverables: projectDeliverables,
  };

  const grantsForLLM = topCandidates.map(c => ({
    id: c.grant.id,
    title: c.grant.title,
    agency: c.grant.agency,
    description: c.grant.description,
    objectives: c.grant.objectives,
    whoCanApply: c.grant.whoCanApply,
    fundingInfo: c.grant.fundingInfo,
    tags: c.grantTags,
  }));

  const llmScoresMap = await calculateBatchLLMRelevance(projectContext, grantsForLLM);

  // Stage 4: Final scoring with LLM results
  const scoredGrants: RecommendationResult[] = [];

  for (const candidate of topCandidates) {
    const llmScore = llmScoresMap.get(candidate.grant.id);
    
    // Final overall score: 60% LLM + 40% rule-based (if LLM available)
    const overallScore = llmScore 
      ? (llmScore.overall * 0.6) + (candidate.prelimScore * 0.4)
      : candidate.prelimScore;

    if (overallScore >= minScore) {
      scoredGrants.push({
        grant: candidate.grant,
        scores: {
          overall: Math.round(overallScore * 10) / 10,
          category: Math.round(candidate.categoryScore * 10) / 10,
          funding: Math.round(candidate.fundingScore * 10) / 10,
          deadline: Math.round(candidate.deadlineScore * 10) / 10,
          semantic: candidate.embeddingScore,
        },
        llmScores: llmScore || null,
        matchReason: llmScore?.reasoning || generateMatchReason(
          project,
          candidate.grant,
          { category: candidate.categoryScore, funding: candidate.fundingScore, semantic: candidate.embeddingScore },
          projectFocusAreas,
          candidate.grantTags
        ),
      });
    }
  }

  // Sort by overall score (now LLM-based) and limit results
  scoredGrants.sort((a, b) => b.scores.overall - a.scores.overall);
  return scoredGrants.slice(0, maxResults);
}

/**
 * Calculate category/focus area match score (0-100)
 * Uses Jaccard similarity for set overlap
 */
function calculateCategoryScore(
  projectAreas: string[],
  grantTags: string[]
): number {
  if (projectAreas.length === 0 || grantTags.length === 0) {
    return 0;
  }

  // Normalize both arrays for comparison
  const projectSet = new Set(projectAreas.map((a) => a.toLowerCase()));
  const grantSet = new Set(grantTags.map((t) => t.toLowerCase()));

  // Calculate intersection
  const intersection = [...projectSet].filter((a) => grantSet.has(a));

  // Jaccard similarity: |A ∩ B| / |A ∪ B|
  const union = new Set([...projectSet, ...grantSet]);
  const jaccardScore = (intersection.length / union.size) * 100;

  // Also give partial credit for any overlap
  const overlapBonus = intersection.length > 0 ? 20 : 0;

  return Math.min(100, jaccardScore + overlapBonus);
}

/**
 * Calculate funding range overlap score (0-100)
 */
function calculateFundingScore(
  projectMin: number | null,
  projectMax: number | null,
  grantMin: number | null,
  grantMax: number | null
): number {
  // If project has no funding requirements, all grants match
  if (projectMin === null && projectMax === null) {
    return 50; // Neutral score
  }

  // If grant has no amount info, give partial credit
  if (grantMin === null && grantMax === null) {
    return 30; // Unknown, but might work
  }

  const pMin = projectMin || 0;
  const pMax = projectMax || Infinity;
  const gMin = grantMin || 0;
  const gMax = grantMax || Infinity;

  // Check for overlap
  const overlapStart = Math.max(pMin, gMin);
  const overlapEnd = Math.min(pMax, gMax);

  if (overlapStart > overlapEnd) {
    // No overlap
    return 0;
  }

  // Calculate percentage of project range that overlaps with grant
  const projectRange = pMax === Infinity ? pMin * 2 : pMax - pMin;
  const overlapRange = overlapEnd - overlapStart;

  if (projectRange === 0) {
    return gMin <= pMin && pMin <= gMax ? 100 : 0;
  }

  const overlapPercent = (overlapRange / projectRange) * 100;

  // Bonus for perfect fit (grant fully covers project needs)
  if (gMin <= pMin && gMax >= pMax) {
    return Math.min(100, overlapPercent + 20);
  }

  return Math.min(100, overlapPercent);
}

/**
 * Calculate deadline urgency score (0-100)
 * Grants closing soon get higher urgency score
 */
function calculateDeadlineScore(deadline: Date): number {
  const now = new Date();
  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDeadline <= 7) {
    return 100; // Very urgent
  } else if (daysUntilDeadline <= 14) {
    return 80;
  } else if (daysUntilDeadline <= 30) {
    return 60;
  } else if (daysUntilDeadline <= 60) {
    return 40;
  } else if (daysUntilDeadline <= 90) {
    return 30;
  } else {
    return 20; // Plenty of time
  }
}

/**
 * Calculate weighted overall score
 * Blends rule-based scores with semantic scores when available
 */
function calculateOverallScore(scores: {
  category: number;
  funding: number;
  deadline: number;
  semantic: number | null;
}): number {
  // When semantic score is available, use blended weights
  if (scores.semantic !== null) {
    const weights = {
      category: 0.25, // Focus area match
      funding: 0.20,  // Funding fit
      deadline: 0.15, // Urgency
      semantic: 0.40, // AI semantic similarity (highest weight)
    };

    return (
      scores.category * weights.category +
      scores.funding * weights.funding +
      scores.deadline * weights.deadline +
      scores.semantic * weights.semantic
    );
  }

  // Fallback to rule-based only
  const weights = {
    category: 0.50,
    funding: 0.30,
    deadline: 0.20,
  };

  return (
    scores.category * weights.category +
    scores.funding * weights.funding +
    scores.deadline * weights.deadline
  );
}

/**
 * Generate a human-readable match reason
 */
function generateMatchReason(
  project: PrismaProject,
  grant: PrismaGrant,
  scores: { category: number; funding: number; semantic: number | null },
  projectAreas: string[],
  grantTags: string[]
): string {
  const reasons: string[] = [];

  // Semantic match explanation (highest priority)
  if (scores.semantic !== null && scores.semantic >= 70) {
    reasons.push("Strong AI semantic match with your project goals");
  } else if (scores.semantic !== null && scores.semantic >= 50) {
    reasons.push("Good semantic alignment with your project");
  }

  // Category match explanation
  const matchingAreas = projectAreas.filter((a) =>
    grantTags.some((t) => t.toLowerCase() === a.toLowerCase())
  );
  if (matchingAreas.length > 0) {
    reasons.push(`Matches your focus areas: ${matchingAreas.join(", ")}`);
  }

  // Funding explanation
  if (scores.funding >= 80) {
    reasons.push("Funding range aligns well with your project needs");
  } else if (scores.funding >= 50) {
    reasons.push("Funding range partially overlaps with your requirements");
  }

  // Deadline context
  const daysUntilDeadline = Math.ceil(
    (grant.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntilDeadline <= 14) {
    reasons.push(`Deadline approaching in ${daysUntilDeadline} days`);
  }

  return reasons.join(". ") + ".";
}

/**
 * Save recommendations to database
 */
export async function saveRecommendations(
  projectId: string,
  recommendations: RecommendationResult[]
): Promise<void> {
  // Delete existing recommendations for this project
  await prisma.projectRecommendation.deleteMany({
    where: { projectId },
  });

  // Insert new recommendations with all scores including LLM
  await prisma.projectRecommendation.createMany({
    data: recommendations.map((rec) => ({
      projectId,
      grantId: rec.grant.id,
      overallScore: rec.scores.overall,
      categoryScore: rec.scores.category,
      fundingScore: rec.scores.funding,
      semanticScore: rec.scores.semantic,
      deadlineScore: rec.scores.deadline,
      llmPurpose: rec.llmScores?.purposeAlignment ?? null,
      llmEligibility: rec.llmScores?.eligibilityFit ?? null,
      llmImpact: rec.llmScores?.impactRelevance ?? null,
      llmOverall: rec.llmScores?.overall ?? null,
      matchReason: rec.matchReason,
    })),
  });
}
