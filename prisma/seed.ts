import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma with better-sqlite3 adapter using DATABASE_URL from .env
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.trackedGrant.deleteMany();
  await prisma.grant.deleteMany();
  await prisma.organization.deleteMany();

  // Create organizations
  const tsaoHQ = await prisma.organization.create({
    data: {
      name: 'Tsao Foundation',
      slug: 'tsao-hq',
    },
  });

  await prisma.organization.create({
    data: {
      name: 'Hua Mei Centre for Successful Ageing',
      slug: 'hua-mei-center',
      parentId: tsaoHQ.id,
    },
  });

  // Create sample grants
  const grants = [
    {
      title: 'Community Arts Programme Grant',
      agency: 'National Arts Council',
      amount: '$50,000 - $100,000',
      amountMin: 50000,
      amountMax: 100000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      description: 'Supporting community-based arts programmes that promote cultural engagement and social cohesion among seniors.',
      url: 'https://www.nac.gov.sg/grants',
      tags: JSON.stringify(['Arts', 'Seniors', 'Community']),
      eligibility: 'Registered nonprofits in Singapore',
    },
    {
      title: 'Healthcare Innovation Fund',
      agency: 'Ministry of Health',
      amount: '$100,000 - $250,000',
      amountMin: 100000,
      amountMax: 250000,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      description: 'Funding for innovative healthcare solutions targeting aging population needs.',
      url: 'https://www.moh.gov.sg',
      tags: JSON.stringify(['Healthcare', 'Innovation', 'Seniors', 'Technology']),
      eligibility: 'Healthcare institutions and NPOs',
    },
    {
      title: 'Social Enterprise Development Grant',
      agency: 'National Council of Social Service',
      amount: '$25,000 - $75,000',
      amountMin: 25000,
      amountMax: 75000,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      description: 'Supporting nonprofits in developing sustainable social enterprise models.',
      url: 'https://www.ncss.gov.sg',
      tags: JSON.stringify(['Social Enterprise', 'Sustainability', 'Capacity Building']),
      eligibility: 'NCSS member organizations',
    },
    {
      title: 'Digital Inclusion Programme',
      agency: 'Infocomm Media Development Authority',
      amount: '$30,000 - $80,000',
      amountMin: 30000,
      amountMax: 80000,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      description: 'Bridging the digital divide for seniors through technology training.',
      url: 'https://www.imda.gov.sg',
      tags: JSON.stringify(['Technology', 'Seniors', 'Digital Literacy', 'Inclusion']),
      eligibility: 'Registered charities and NPOs',
    },
    {
      title: 'Volunteer Management Excellence Grant',
      agency: "People's Association",
      amount: '$15,000 - $40,000',
      amountMin: 15000,
      amountMax: 40000,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      description: 'Enhancing volunteer management capabilities in community organizations.',
      url: 'https://www.pa.gov.sg',
      tags: JSON.stringify(['Volunteers', 'Community', 'Capacity Building']),
      eligibility: 'Community-based organizations',
    },
    {
      title: 'Mental Wellness Initiative Fund',
      agency: 'Agency for Integrated Care',
      amount: '$50,000 - $120,000',
      amountMin: 50000,
      amountMax: 120000,
      deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      description: 'Supporting mental wellness programmes for seniors.',
      url: 'https://www.aic.sg',
      tags: JSON.stringify(['Healthcare', 'Mental Health', 'Seniors', 'Wellness']),
      eligibility: 'AIC partner organizations',
    },
    {
      title: 'Active Ageing Programme Grant',
      agency: 'Ministry of Social and Family Development',
      amount: '$20,000 - $60,000',
      amountMin: 20000,
      amountMax: 60000,
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      description: 'Promoting active ageing through physical activities and lifelong learning.',
      url: 'https://www.msf.gov.sg',
      tags: JSON.stringify(['Seniors', 'Active Ageing', 'Wellness', 'Education']),
      eligibility: 'Senior activity centres and NPOs',
    },
    {
      title: 'Intergenerational Bonding Fund',
      agency: 'Community Development Council',
      amount: '$10,000 - $30,000',
      amountMin: 10000,
      amountMax: 30000,
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      description: 'Fostering stronger bonds between generations through joint activities.',
      url: 'https://www.cdc.gov.sg',
      tags: JSON.stringify(['Community', 'Youth', 'Seniors', 'Intergenerational']),
      eligibility: 'Community organizations',
    },
  ];

  for (const grant of grants) {
    await prisma.grant.create({ data: grant });
  }

  console.log(`✅ Created ${grants.length} grants`);
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
