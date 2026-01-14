import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
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

  // Sample grants data (matches the format used in pages)
  const sampleGrants = [
    {
      title: 'Community Arts Programme Grant',
      agency: 'National Arts Council',
      amount: '$50,000 - $100,000',
      amountMin: 50000,
      amountMax: 100000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      description: 'Supporting community-based arts programmes that promote cultural engagement and social cohesion among seniors and intergenerational groups.',
      tags: JSON.stringify(['Arts', 'Seniors', 'Community']),
      issueArea: 'arts',
    },
    {
      title: 'Healthcare Innovation Fund',
      agency: 'Ministry of Health',
      amount: '$100,000 - $250,000',
      amountMin: 100000,
      amountMax: 250000,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      description: 'Funding for innovative healthcare solutions targeting aging population needs, including telemedicine and home care services.',
      tags: JSON.stringify(['Healthcare', 'Innovation', 'Seniors', 'Technology']),
      issueArea: 'healthcare',
    },
    {
      title: 'Social Enterprise Development Grant',
      agency: 'National Council of Social Service',
      amount: '$25,000 - $75,000',
      amountMin: 25000,
      amountMax: 75000,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      description: 'Supporting nonprofits in developing sustainable social enterprise models to support their mission delivery.',
      tags: JSON.stringify(['Social Enterprise', 'Sustainability', 'Capacity Building']),
      issueArea: 'social-enterprise',
    },
    {
      title: 'Digital Inclusion Programme',
      agency: 'Infocomm Media Development Authority',
      amount: '$30,000 - $80,000',
      amountMin: 30000,
      amountMax: 80000,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      description: 'Bridging the digital divide for seniors through technology training and device accessibility programmes.',
      tags: JSON.stringify(['Technology', 'Seniors', 'Digital Literacy', 'Inclusion']),
      issueArea: 'technology',
    },
    {
      title: 'Volunteer Management Excellence Grant',
      agency: "People's Association",
      amount: '$15,000 - $40,000',
      amountMin: 15000,
      amountMax: 40000,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      description: 'Enhancing volunteer management capabilities and building sustainable volunteering programmes in community organizations.',
      tags: JSON.stringify(['Volunteers', 'Community', 'Capacity Building']),
      issueArea: 'community',
    },
    {
      title: 'Mental Wellness Initiative Fund',
      agency: 'Agency for Integrated Care',
      amount: '$50,000 - $120,000',
      amountMin: 50000,
      amountMax: 120000,
      deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      description: 'Supporting mental wellness programmes for seniors, including counseling services, support groups, and community outreach.',
      tags: JSON.stringify(['Healthcare', 'Mental Health', 'Seniors', 'Wellness']),
      issueArea: 'healthcare',
    },
  ];

  // Create grants
  const createdGrants = [];
  for (const grantData of sampleGrants) {
    const grant = await prisma.grant.create({ data: grantData });
    createdGrants.push(grant);
    console.log(`✅ Created grant: ${grant.title.substring(0, 40)}...`);
  }

  console.log(`✅ Created ${createdGrants.length} sample grants`);

  // Create tracked grants for demo user
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@grantsync.com' },
  });

  if (demoUser && createdGrants.length >= 3) {
    // Track first 3 grants with different statuses
    await prisma.trackedGrant.create({
      data: {
        userId: demoUser.id,
        grantId: createdGrants[0].id,
        status: 'new',
      },
    });
    await prisma.trackedGrant.create({
      data: {
        userId: demoUser.id,
        grantId: createdGrants[1].id,
        status: 'reviewing',
      },
    });
    await prisma.trackedGrant.create({
      data: {
        userId: demoUser.id,
        grantId: createdGrants[3].id,
        status: 'applied',
      },
    });
    console.log('✅ Created sample tracked grants for demo user');
  }

  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
