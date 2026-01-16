/**
 * Gemini Embedding Service (pgvector version)
 * 
 * Generates text embeddings using Google's text-embedding-004 model
 * and provides cosine similarity utilities for pgvector.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && typeof window === 'undefined') {
  console.warn('GEMINI_API_KEY not set - embeddings will be disabled');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
// Using gemini-embedding-001 (stable, 768 dimensions recommended)
const embeddingModel = genAI?.getGenerativeModel({ model: 'gemini-embedding-001' });

/**
 * Generate embedding vector for text (768 dimensions)
 * Returns null if API key not configured or error occurs
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!embeddingModel || !text?.trim()) {
    return null;
  }

  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return null;
  }
}

/**
 * Convert array to pgvector format: [1,2,3] -> '[1,2,3]'
 */
export function toPgVector(arr: number[]): string {
  return `[${arr.join(',')}]`;
}

/**
 * Parse pgvector string to array: '[1,2,3]' -> [1,2,3]
 */
export function parsePgVector(str: string | null): number[] | null {
  if (!str) return null;
  try {
    // pgvector returns strings like '[1,2,3]'
    return JSON.parse(str.replace(/^\[/, '[').replace(/\]$/, ']'));
  } catch {
    return null;
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Convert cosine similarity (-1 to 1) to percentage score (0 to 100)
 */
export function similarityToScore(similarity: number): number {
  return Math.round(((similarity + 1) / 2) * 100);
}

/**
 * SQL template for cosine distance (use in ORDER BY for similarity search)
 * Lower distance = more similar
 * 
 * Usage in raw SQL:
 *   ORDER BY "objectivesEmbed" <=> $1::vector ASC
 */
export const COSINE_DISTANCE_OP = '<=>';

/**
 * SQL template for cosine similarity calculation
 * Use: 1 - (a <=> b) to get similarity from distance
 */
export function buildSimilarityQuery(columnName: string, vectorParam: string): string {
  return `1 - ("${columnName}" ${COSINE_DISTANCE_OP} ${vectorParam}::vector)`;
}
