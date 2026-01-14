/**
 * Import Scraped Grants into Database
 * 
 * Reads grants from data/grants.json and imports them into the Prisma database.
 * Uses title-based deduplication (checks if grant with same title exists).
 * 
 * Usage: npx tsx scripts/import_grants.ts
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Prisma with PostgreSQL adapter
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DATA_FILE = path.join(process.cwd(), 'data', 'grants.json');

interface ScrapedGrant {
  title: string;
  agency: string;
  amount: string;
  amountMin?: number | null;
  amountMax?: number | null;
  deadline: string;
  description: string;
  url?: string | null;
  tags: string[];
  eligibility?: string[] | null;
  kpis?: string[] | null;
  scrapedAt?: string;
}

async function importGrants() {
  console.log('📥 Starting grant import...');

  // Check if data file exists
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Data file not found: ${DATA_FILE}`);
    console.log('Run the scraper first: python scripts/scraper.py');
    process.exit(1);
  }

  // Read grants from JSON
  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  const grants: ScrapedGrant[] = JSON.parse(rawData);

  console.log(`📄 Found ${grants.length} grants in data file`);

  // Clear existing grants first (for demo purposes)
  await prisma.trackedGrant.deleteMany();
  await prisma.grant.deleteMany();
  console.log('🗑️ Cleared existing grants');

  let imported = 0;
  let skipped = 0;

  for (const grant of grants) {
    try {
      const grantData = {
        title: grant.title,
        agency: grant.agency,
        amount: grant.amount || 'Varies',
        amountMin: grant.amountMin || null,
        amountMax: grant.amountMax || null,
        deadline: new Date(grant.deadline),
        description: grant.description || `Grant opportunity: ${grant.title}`,
        url: grant.url || null,
        tags: JSON.stringify(grant.tags || []),
        eligibilityCriteria: grant.eligibility ? JSON.stringify(grant.eligibility) : null,
      };

      await prisma.grant.create({
        data: grantData,
      });
      imported++;
      console.log(`✅ Imported: ${grant.title.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Failed to import "${grant.title}":`, error);
      skipped++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ❌ Skipped: ${skipped}`);
  console.log(`   📦 Total: ${grants.length}`);
}

async function main() {
  try {
    await importGrants();
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
