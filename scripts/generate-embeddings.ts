/**
 * Generate Embeddings Script (pgvector version)
 * 
 * Generates section-based embeddings for grants using Gemini API
 * and stores them as native pgvector columns.
 * 
 * Prerequisites:
 *   1. Run: psql -f prisma/enable_pgvector.sql (or via Neon SQL Editor)
 *   2. Run: npx prisma db push
 * 
 * Usage: npx tsx scripts/generate-embeddings.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Import shared embedding service
import { generateEmbedding, toPgVector } from '../src/lib/embedding-service';

// Initialize Prisma
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Raw pg pool for vector operations
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function generateGrantEmbeddings() {
  console.log('🚀 Starting embedding generation for grants (pgvector)...\n');
  console.log('Using model: gemini-embedding-001 (768 dimensions)\n');
  
  // Get grants without embeddings
  const grants = await prisma.grant.findMany({
    select: {
      id: true,
      title: true,
      objectives: true,
      whoCanApply: true,
      fundingInfo: true,
      deliverables: true,
      requiredDocs: true,
      description: true,
    },
  });
  
  // Filter grants that need embeddings (check via raw SQL)
  const { rows: embeddedGrants } = await pool.query(
    `SELECT id FROM "Grant" WHERE "objectivesEmbed" IS NOT NULL`
  );
  const embeddedIds = new Set(embeddedGrants.map(r => r.id));
  
  const grantsToProcess = grants.filter(g => !embeddedIds.has(g.id));
  console.log(`📋 Found ${grantsToProcess.length} grants without embeddings\n`);
  
  let processed = 0;
  let failed = 0;
  
  for (const grant of grantsToProcess) {
    // Rate limiting - Gemini has quota limits
    await new Promise(r => setTimeout(r, 100));
    
    try {
      // Generate section embeddings using shared service
      const objectivesText = grant.objectives || grant.description;
      const eligibilityText = grant.whoCanApply || '';
      const fundingText = grant.fundingInfo || '';
      const deliverablesText = grant.deliverables || grant.requiredDocs || '';
      
      const [objectivesEmbed, eligibilityEmbed, fundingEmbed, deliverablesEmbed] = await Promise.all([
        generateEmbedding(objectivesText),
        generateEmbedding(eligibilityText),
        generateEmbedding(fundingText),
        generateEmbedding(deliverablesText),
      ]);
      
      // Update grant with embeddings using raw SQL
      await pool.query(
        `UPDATE "Grant" SET
          "objectivesEmbed" = $1::vector,
          "eligibilityEmbed" = $2::vector,
          "fundingEmbed" = $3::vector,
          "deliverablesEmbed" = $4::vector
        WHERE id = $5`,
        [
          objectivesEmbed ? toPgVector(objectivesEmbed) : null,
          eligibilityEmbed ? toPgVector(eligibilityEmbed) : null,
          fundingEmbed ? toPgVector(fundingEmbed) : null,
          deliverablesEmbed ? toPgVector(deliverablesEmbed) : null,
          grant.id,
        ]
      );
      
      processed++;
      console.log(`✅ [${processed}/${grantsToProcess.length}] ${grant.title}`);
    } catch (error) {
      failed++;
      console.error(`❌ Failed: ${grant.title}`, error);
    }
  }
  
  console.log('\n📊 Embedding Generation Summary:');
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ❌ Failed: ${failed}`);
}

generateGrantEmbeddings()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
