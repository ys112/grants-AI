/**
 * Database Reset Script
 * 
 * Purges grants, projects, and recommendations tables.
 * Usage: npx tsx scripts/reset-grants.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function resetDatabase() {
  console.log('⚠️  Resetting grants database...\n');

  // Delete in order due to foreign key constraints
  const recommendations = await prisma.projectRecommendation.deleteMany();
  console.log(`🗑️  Deleted ${recommendations.count} project recommendations`);

  const projects = await prisma.project.deleteMany();
  console.log(`🗑️  Deleted ${projects.count} projects`);

  const tracked = await prisma.trackedGrant.deleteMany();
  console.log(`🗑️  Deleted ${tracked.count} tracked grants`);

  const grants = await prisma.grant.deleteMany();
  console.log(`🗑️  Deleted ${grants.count} grants`);

  console.log('\n✅ Database reset complete!');
}

resetDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
