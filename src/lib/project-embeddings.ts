/**
 * Project Embedding Service
 * 
 * Generates and stores embeddings for projects using pgvector.
 * Called on project create/update.
 */

import pg from 'pg';
import { generateEmbedding, toPgVector } from './embedding-service';

export interface ProjectEmbeddingData {
  id: string;
  description: string;
  targetPopulation: string;
  expectedOutcomes?: string | null;
  deliverables?: string | null;
}

/**
 * Generate and store embeddings for a project
 * Uses raw SQL to handle pgvector Unsupported type
 */
export async function generateProjectEmbeddings(project: ProjectEmbeddingData): Promise<void> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set - skipping project embeddings');
    return;
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Generate embeddings for each section
    const [goalEmbed, populationEmbed, outcomesEmbed, deliverablesEmbed] = await Promise.all([
      generateEmbedding(project.description),
      generateEmbedding(project.targetPopulation),
      generateEmbedding(project.expectedOutcomes || ''),
      generateEmbedding(project.deliverables || ''),
    ]);

    // Update project with embeddings using raw SQL
    await pool.query(
      `UPDATE "Project" SET
        "goalEmbed" = $1::vector,
        "populationEmbed" = $2::vector,
        "outcomesEmbed" = $3::vector,
        "deliverablesEmbed" = $4::vector
      WHERE id = $5`,
      [
        goalEmbed ? toPgVector(goalEmbed) : null,
        populationEmbed ? toPgVector(populationEmbed) : null,
        outcomesEmbed ? toPgVector(outcomesEmbed) : null,
        deliverablesEmbed ? toPgVector(deliverablesEmbed) : null,
        project.id,
      ]
    );

    console.log(`✅ Generated embeddings for project: ${project.id}`);
  } catch (error) {
    console.error('Failed to generate project embeddings:', error);
  } finally {
    await pool.end();
  }
}
