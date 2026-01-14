/**
 * Drizzle ORM Performance Profiler
 * Run: npx tsx scripts/profile-drizzle.ts
 * 
 * This script benchmarks common database queries to compare
 * performance after migrating from Prisma to Drizzle.
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, asc, count, avg, max, min } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as schema from '../src/db/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle(pool, { schema });

interface BenchmarkResult {
  name: string;
  iterations: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  totalMs: number;
}

const results: BenchmarkResult[] = [];

async function benchmark(name: string, fn: () => Promise<unknown>, iterations = 10): Promise<BenchmarkResult> {
  const times: number[] = [];
  
  // Warmup run
  await fn();
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const result = {
    name,
    iterations,
    avgMs: times.reduce((a, b) => a + b, 0) / times.length,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    totalMs: times.reduce((a, b) => a + b, 0),
  };
  
  results.push(result);
  console.log(`✅ ${name}: avg=${result.avgMs.toFixed(2)}ms, min=${result.minMs.toFixed(2)}ms, max=${result.maxMs.toFixed(2)}ms`);
  
  return result;
}

async function main() {
  console.log('🔍 Drizzle ORM Performance Profiler');
  console.log('===================================\n');
  console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'connected'}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  // First, let's get some stats about the data
  const [grantCountResult] = await db.select({ count: count() }).from(schema.grants);
  const [userCountResult] = await db.select({ count: count() }).from(schema.users);
  const [trackedGrantCountResult] = await db.select({ count: count() }).from(schema.trackedGrants);
  
  const grantCount = grantCountResult?.count ?? 0;
  const userCount = userCountResult?.count ?? 0;
  const trackedGrantCount = trackedGrantCountResult?.count ?? 0;
  
  console.log('📊 Data Stats:');
  console.log(`   Grants: ${grantCount}`);
  console.log(`   Users: ${userCount}`);
  console.log(`   Tracked Grants: ${trackedGrantCount}\n`);
  
  console.log('🏃 Running Benchmarks...\n');
  
  // ===== GRANTS QUERIES =====
  console.log('--- Grants Queries ---');
  
  await benchmark('grant.findMany (list all)', async () => {
    return db.select().from(schema.grants).orderBy(asc(schema.grants.deadline));
  });
  
  await benchmark('grant.findMany (with take limit 10)', async () => {
    return db.select().from(schema.grants).orderBy(asc(schema.grants.deadline)).limit(10);
  });
  
  await benchmark('grant.findMany (filtered by issueArea)', async () => {
    return db.select().from(schema.grants)
      .where(eq(schema.grants.issueArea, 'healthcare'))
      .orderBy(asc(schema.grants.deadline));
  });
  
  await benchmark('grant.count', async () => {
    return db.select({ count: count() }).from(schema.grants);
  });
  
  // ===== USER QUERIES =====
  console.log('\n--- User Queries ---');
  
  await benchmark('user.findMany', async () => {
    return db.select().from(schema.users);
  });
  
  await benchmark('user.findFirst with sessions', async () => {
    return db.query.users.findFirst({
      with: {
        sessions: true,
        accounts: true,
      },
    });
  });
  
  // ===== TRACKED GRANTS (Relations) =====
  console.log('\n--- TrackedGrant Queries (Relations) ---');
  
  await benchmark('trackedGrant.findMany with include', async () => {
    return db.query.trackedGrants.findMany({
      with: {
        grant: true,
        user: true,
      },
    });
  });
  
  await benchmark('trackedGrant.findMany (user grants)', async () => {
    const user = await db.select().from(schema.users).limit(1);
    if (!user[0]) return [];
    return db.query.trackedGrants.findMany({
      where: eq(schema.trackedGrants.userId, user[0].id),
      with: { grant: true },
    });
  });
  
  // ===== WRITE OPERATIONS =====
  console.log('\n--- Write Operations (Single Run) ---');
  
  // Create and delete a test grant
  const now = new Date();
  const createStart = performance.now();
  const [testGrant] = await db.insert(schema.grants)
    .values({
      title: 'BENCHMARK_TEST_GRANT',
      agency: 'Test Agency',
      amount: '$10,000',
      deadline: now,
      description: 'Benchmark test grant - will be deleted',
      tags: '["test"]',
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const createTime = performance.now() - createStart;
  console.log(`✅ grant.create: ${createTime.toFixed(2)}ms`);
  results.push({
    name: 'grant.create',
    iterations: 1,
    avgMs: createTime,
    minMs: createTime,
    maxMs: createTime,
    totalMs: createTime,
  });
  
  const deleteStart = performance.now();
  await db.delete(schema.grants).where(eq(schema.grants.id, testGrant.id));
  const deleteTime = performance.now() - deleteStart;
  console.log(`✅ grant.delete: ${deleteTime.toFixed(2)}ms`);
  results.push({
    name: 'grant.delete',
    iterations: 1,
    avgMs: deleteTime,
    minMs: deleteTime,
    maxMs: deleteTime,
    totalMs: deleteTime,
  });
  
  // ===== COMPLEX QUERIES =====
  console.log('\n--- Complex/Aggregate Queries ---');
  
  await benchmark('grant.groupBy (by issueArea)', async () => {
    return db.select({
      issueArea: schema.grants.issueArea,
      count: count(),
    })
    .from(schema.grants)
    .groupBy(schema.grants.issueArea);
  });
  
  await benchmark('grant.aggregate (amount stats)', async () => {
    return db.select({
      avgMin: avg(schema.grants.amountMin),
      avgMax: avg(schema.grants.amountMax),
      maxMax: max(schema.grants.amountMax),
      minMin: min(schema.grants.amountMin),
    }).from(schema.grants);
  });
  
  // ===== SUMMARY =====
  console.log('\n===================================');
  console.log('📈 BENCHMARK SUMMARY');
  console.log('===================================\n');
  
  // Sort by average time
  const sortedResults = [...results].sort((a, b) => b.avgMs - a.avgMs);
  
  console.log('Slowest to Fastest:');
  sortedResults.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}: ${r.avgMs.toFixed(2)}ms avg`);
  });
  
  const totalAvg = results.reduce((sum, r) => sum + r.avgMs, 0);
  console.log(`\nTotal average time: ${totalAvg.toFixed(2)}ms`);
  
  // Load Prisma results for comparison
  const prismaResultsPath = path.join(__dirname, 'prisma-benchmark-results.json');
  if (fs.existsSync(prismaResultsPath)) {
    const prismaResults = JSON.parse(fs.readFileSync(prismaResultsPath, 'utf-8'));
    const prismaTotal = prismaResults.summary.totalAvgMs;
    const improvement = ((prismaTotal - totalAvg) / prismaTotal * 100).toFixed(1);
    console.log(`\n🔄 Prisma total: ${prismaTotal.toFixed(2)}ms`);
    console.log(`✨ Drizzle total: ${totalAvg.toFixed(2)}ms`);
    console.log(`📈 Improvement: ${improvement}%`);
  }
  
  // Save results to file
  const reportData = {
    orm: 'drizzle',
    version: '0.45.1',
    timestamp: new Date().toISOString(),
    dataStats: {
      grants: grantCount,
      users: userCount,
      trackedGrants: trackedGrantCount,
    },
    benchmarks: results,
    summary: {
      totalAvgMs: totalAvg,
      slowestQuery: sortedResults[0]?.name,
      slowestAvgMs: sortedResults[0]?.avgMs,
      fastestQuery: sortedResults[sortedResults.length - 1]?.name,
      fastestAvgMs: sortedResults[sortedResults.length - 1]?.avgMs,
    },
  };
  
  const reportPath = path.join(__dirname, 'drizzle-benchmark-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n💾 Results saved to: ${reportPath}`);
  
  await pool.end();
}

main().catch(async (e) => {
  console.error('Benchmark failed:', e);
  await pool.end();
  process.exit(1);
});
