/**
 * Seed script for GrantSync using Drizzle ORM
 * Run: npm run db:seed
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { hashPassword } from 'better-auth/crypto';
import * as schema from '../src/db/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle(pool, { schema });

// Demo users configuration
const demoUsers = [
  {
    email: 'admin@tsao.org',
    name: 'Admin User',
    password: 'admin123',
    role: 'admin',
  },
  {
    email: 'partner@huamei.org',
    name: 'Partner User',
    password: 'partner123',
    role: 'partner',
  },
  {
    email: 'demo@grantsync.com',
    name: 'Demo User',
    password: 'demo123',
    role: 'partner',
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  const now = new Date();

  // Clear existing data (order matters for foreign keys)
  await db.delete(schema.trackedGrants);
  await db.delete(schema.sessions);
  await db.delete(schema.accounts);
  await db.delete(schema.verifications);
  await db.delete(schema.users);
  await db.delete(schema.grants);
  await db.delete(schema.organizations);

  console.log('🗑️ Cleared existing data');

  // Create organizations
  const [tsaoHQ] = await db.insert(schema.organizations)
    .values({
      name: 'Tsao Foundation',
      slug: 'tsao-hq',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [huaMei] = await db.insert(schema.organizations)
    .values({
      name: 'Hua Mei Centre for Successful Ageing',
      slug: 'hua-mei-center',
      parentId: tsaoHQ.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  console.log('✅ Created organizations');

  // Create demo users directly in the database with hashed passwords
  for (const userData of demoUsers) {
    const orgId = userData.email.includes('huamei') ? huaMei.id : tsaoHQ.id;
    
    // Hash password with Better Auth's native scrypt hasher
    const hashedPassword = await hashPassword(userData.password);
    
    // Create the user
    const [user] = await db.insert(schema.users)
      .values({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        organizationId: orgId,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create the credential account with hashed password
    await db.insert(schema.accounts)
      .values({
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });

    console.log(`✅ Created user: ${userData.email} (password: ${userData.password})`);
  }

  console.log('\n📋 Demo Login Credentials:');
  console.log('   admin@tsao.org / admin123');
  console.log('   partner@huamei.org / partner123');
  console.log('   demo@grantsync.com / demo123');
  
  console.log('\n💡 Run `npm run import-grants` to populate grants');
  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
