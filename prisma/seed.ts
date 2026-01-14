import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from 'better-auth/crypto';

// Prisma 7 uses driver adapters for database connections
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

  // Clear existing data (order matters for foreign keys)
  await prisma.trackedGrant.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.grant.deleteMany();
  await prisma.organization.deleteMany();

  console.log('🗑️ Cleared existing data');

  // Create organizations
  const tsaoHQ = await prisma.organization.create({
    data: {
      name: 'Tsao Foundation',
      slug: 'tsao-hq',
    },
  });

  const huaMei = await prisma.organization.create({
    data: {
      name: 'Hua Mei Centre for Successful Ageing',
      slug: 'hua-mei-center',
      parentId: tsaoHQ.id,
    },
  });

  console.log('✅ Created organizations');

  // Create demo users directly in the database with hashed passwords
  // Better Auth uses bcrypt for password hashing
  for (const userData of demoUsers) {
    const orgId = userData.email.includes('huamei') ? huaMei.id : tsaoHQ.id;
    
    // Hash password with Better Auth's native scrypt hasher
    const hashedPassword = await hashPassword(userData.password);
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        organizationId: orgId,
        emailVerified: true,
      },
    });

    // Create the credential account with hashed password
    // Better Auth stores password credentials in the Account table
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
      },
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
    await prisma.$disconnect();
  });
