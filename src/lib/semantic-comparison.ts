/**
 * Semantic Comparison Service
 * 
 * Calculates section-based semantic similarity between projects and grants
 * using pgvector embeddings.
 */

import pg from 'pg';
import { cosineSimilarity, similarityToScore } from './embedding-service';

export interface SectionSimilarityScores {
  purpose: number;      // project goal vs grant objectives (0-100)
  eligibility: number;  // project population vs grant eligibility (0-100)
  deliverables: number; // project deliverables vs grant deliverables (0-100)
  overall: number;      // weighted average (0-100)
}

interface EmbeddingRow {
  id: string;
  goalEmbed?: string | null;
  populationEmbed?: string | null;
  outcomesEmbed?: string | null;
  deliverablesEmbed?: string | null;
  objectivesEmbed?: string | null;
  eligibilityEmbed?: string | null;
  fundingEmbed?: string | null;
}

function parseVector(str: string | null): number[] | null {
  if (!str) return null;
  try {
    // pgvector returns as string like '[1,2,3]'
    const cleaned = str.replace(/^\[/, '').replace(/\]$/, '');
    return cleaned.split(',').map(Number);
  } catch {
    return null;
  }
}

/**
 * Calculate semantic similarity scores between a project and grant
 */
export async function calculateSemanticSimilarity(
  projectId: string,
  grantId: string
): Promise<SectionSimilarityScores | null> {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Fetch project embeddings
    const { rows: projectRows } = await pool.query<EmbeddingRow>(
      `SELECT id, "goalEmbed"::text, "populationEmbed"::text, 
              "outcomesEmbed"::text, "deliverablesEmbed"::text 
       FROM "Project" WHERE id = $1`,
      [projectId]
    );

    // Fetch grant embeddings
    const { rows: grantRows } = await pool.query<EmbeddingRow>(
      `SELECT id, "objectivesEmbed"::text, "eligibilityEmbed"::text,
              "fundingEmbed"::text, "deliverablesEmbed"::text
       FROM "Grant" WHERE id = $1`,
      [grantId]
    );

    if (!projectRows[0] || !grantRows[0]) {
      return null;
    }

    const project = projectRows[0];
    const grant = grantRows[0];

    // Parse vectors
    const projectGoal = parseVector(project.goalEmbed ?? null);
    const projectPopulation = parseVector(project.populationEmbed ?? null);
    const projectDeliverables = parseVector(project.deliverablesEmbed ?? null);

    const grantObjectives = parseVector(grant.objectivesEmbed ?? null);
    const grantEligibility = parseVector(grant.eligibilityEmbed ?? null);
    const grantDeliverables = parseVector(grant.deliverablesEmbed ?? null);

    // Calculate section similarities
    const purposeSim = projectGoal && grantObjectives
      ? cosineSimilarity(projectGoal, grantObjectives)
      : 0;

    const eligibilitySim = projectPopulation && grantEligibility
      ? cosineSimilarity(projectPopulation, grantEligibility)
      : 0;

    const deliverablesSim = projectDeliverables && grantDeliverables
      ? cosineSimilarity(projectDeliverables, grantDeliverables)
      : 0;

    // Convert to scores
    const purpose = similarityToScore(purposeSim);
    const eligibility = similarityToScore(eligibilitySim);
    const deliverables = similarityToScore(deliverablesSim);

    // Weighted average (purpose: 40%, eligibility: 40%, deliverables: 20%)
    const overall = Math.round(
      purpose * 0.4 + eligibility * 0.4 + deliverables * 0.2
    );

    return { purpose, eligibility, deliverables, overall };
  } catch (error) {
    console.error('Semantic similarity calculation failed:', error);
    return null;
  } finally {
    await pool.end();
  }
}

/**
 * Batch calculate semantic similarity for multiple grants
 */
export async function calculateBatchSemanticSimilarity(
  projectId: string,
  grantIds: string[]
): Promise<Map<string, SectionSimilarityScores>> {
  const results = new Map<string, SectionSimilarityScores>();
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Fetch project embeddings
    const { rows: projectRows } = await pool.query<EmbeddingRow>(
      `SELECT id, "goalEmbed"::text, "populationEmbed"::text, 
              "outcomesEmbed"::text, "deliverablesEmbed"::text 
       FROM "Project" WHERE id = $1`,
      [projectId]
    );

    if (!projectRows[0]) {
      return results;
    }

    const project = projectRows[0];
    const projectGoal = parseVector(project.goalEmbed ?? null);
    const projectPopulation = parseVector(project.populationEmbed ?? null);
    const projectDeliverables = parseVector(project.deliverablesEmbed ?? null);

    // If project has no embeddings, return empty
    if (!projectGoal && !projectPopulation && !projectDeliverables) {
      return results;
    }

    // Fetch all grant embeddings in one query
    const { rows: grantRows } = await pool.query<EmbeddingRow>(
      `SELECT id, "objectivesEmbed"::text, "eligibilityEmbed"::text,
              "fundingEmbed"::text, "deliverablesEmbed"::text
       FROM "Grant" WHERE id = ANY($1)`,
      [grantIds]
    );

    for (const grant of grantRows) {
      const grantObjectives = parseVector(grant.objectivesEmbed ?? null);
      const grantEligibility = parseVector(grant.eligibilityEmbed ?? null);
      const grantDeliverables = parseVector(grant.deliverablesEmbed ?? null);

      const purposeSim = projectGoal && grantObjectives
        ? cosineSimilarity(projectGoal, grantObjectives)
        : 0;

      const eligibilitySim = projectPopulation && grantEligibility
        ? cosineSimilarity(projectPopulation, grantEligibility)
        : 0;

      const deliverablesSim = projectDeliverables && grantDeliverables
        ? cosineSimilarity(projectDeliverables, grantDeliverables)
        : 0;

      const purpose = similarityToScore(purposeSim);
      const eligibility = similarityToScore(eligibilitySim);
      const deliverables = similarityToScore(deliverablesSim);

      // Weighted average (purpose: 40%, eligibility: 40%, deliverables: 20%)
      const overall = Math.round(
        purpose * 0.4 + eligibility * 0.4 + deliverables * 0.2
      );

      results.set(grant.id, { purpose, eligibility, deliverables, overall });
    }

    return results;
  } catch (error) {
    console.error('Batch semantic similarity failed:', error);
    return results;
  } finally {
    await pool.end();
  }
}
