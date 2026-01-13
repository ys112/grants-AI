import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  console.log('✅ Created organizations');
  
  // Note: Run `npm run scrape` to populate grants from the scraper
  console.log('💡 Run `npm run scrape` to populate grants');
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
