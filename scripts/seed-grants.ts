/**
 * Seed Sample Grants for Demo/Testing
 * Run: npx tsx scripts/seed-grants.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle(pool, { schema });

const sampleGrants = [
  {
    title: 'Community Arts Programme Grant',
    agency: 'National Arts Council',
    amount: '$50,000 - $100,000',
    amountMin: 50000,
    amountMax: 100000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    description: 'Supporting community-based arts programmes that promote cultural engagement and social cohesion among seniors and intergenerational groups.',
    tags: ['Arts', 'Seniors', 'Community'],
    issueArea: 'arts',
    url: 'https://www.nac.gov.sg/support/funding/grants',
  },
  {
    title: 'Healthcare Innovation Fund',
    agency: 'Ministry of Health',
    amount: '$100,000 - $250,000',
    amountMin: 100000,
    amountMax: 250000,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    description: 'Funding for innovative healthcare solutions targeting aging population needs, including telemedicine and home care services.',
    tags: ['Healthcare', 'Innovation', 'Seniors', 'Technology'],
    issueArea: 'healthcare',
    url: 'https://www.moh.gov.sg/grants',
  },
  {
    title: 'Social Enterprise Development Grant',
    agency: 'National Council of Social Service',
    amount: '$25,000 - $75,000',
    amountMin: 25000,
    amountMax: 75000,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    description: 'Supporting nonprofits in developing sustainable social enterprise models to support their mission delivery.',
    tags: ['Social Enterprise', 'Sustainability', 'Capacity Building'],
    issueArea: 'social_enterprise',
    url: 'https://www.ncss.gov.sg/grants',
  },
  {
    title: 'Digital Inclusion Programme',
    agency: 'Infocomm Media Development Authority',
    amount: '$30,000 - $80,000',
    amountMin: 30000,
    amountMax: 80000,
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    description: 'Bridging the digital divide for seniors through technology training and device accessibility programmes.',
    tags: ['Technology', 'Seniors', 'Digital Literacy', 'Inclusion'],
    issueArea: 'technology',
    url: 'https://www.imda.gov.sg/grants',
  },
  {
    title: 'Volunteer Management Excellence Grant',
    agency: "People's Association",
    amount: '$15,000 - $40,000',
    amountMin: 15000,
    amountMax: 40000,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    description: 'Enhancing volunteer management capabilities and building sustainable volunteering programmes in community organizations.',
    tags: ['Volunteers', 'Community', 'Capacity Building'],
    issueArea: 'community',
    url: 'https://www.pa.gov.sg/grants',
  },
  {
    title: 'Mental Wellness Initiative Fund',
    agency: 'Agency for Integrated Care',
    amount: '$50,000 - $120,000',
    amountMin: 50000,
    amountMax: 120000,
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    description: 'Supporting mental wellness programmes for seniors, including counseling services, support groups, and community outreach.',
    tags: ['Healthcare', 'Mental Health', 'Seniors', 'Wellness'],
    issueArea: 'healthcare',
    url: 'https://www.aic.sg/grants',
  },
  {
    title: 'Elder Care Innovation Challenge',
    agency: 'Singapore Economic Development Board',
    amount: '$200,000 - $500,000',
    amountMin: 200000,
    amountMax: 500000,
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    description: 'Supporting innovative solutions for elder care including smart home technologies, wearable devices, and AI-powered monitoring systems.',
    tags: ['Healthcare', 'Technology', 'Seniors', 'Innovation'],
    issueArea: 'healthcare',
    url: 'https://www.edb.gov.sg/grants',
  },
  {
    title: 'Community Resilience Building Grant',
    agency: 'Ministry of Culture, Community and Youth',
    amount: '$20,000 - $60,000',
    amountMin: 20000,
    amountMax: 60000,
    deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    description: 'Building community resilience through inter-cultural programmes, disaster preparedness training, and neighborhood bonding activities.',
    tags: ['Community', 'Resilience', 'Social Cohesion'],
    issueArea: 'community',
    url: 'https://www.mccy.gov.sg/grants',
  },
  {
    title: 'Green Spaces for Seniors Initiative',
    agency: 'National Parks Board',
    amount: '$40,000 - $100,000',
    amountMin: 40000,
    amountMax: 100000,
    deadline: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
    description: 'Creating accessible green spaces and therapeutic gardens for seniors to promote physical activity and mental wellbeing.',
    tags: ['Environment', 'Seniors', 'Wellness', 'Community'],
    issueArea: 'environment',
    url: 'https://www.nparks.gov.sg/grants',
  },
  {
    title: 'Skills Future for Seniors',
    agency: 'SkillsFuture Singapore',
    amount: '$80,000 - $180,000',
    amountMin: 80000,
    amountMax: 180000,
    deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    description: 'Developing and delivering upskilling programmes targeted at seniors to help them remain employable and active in the workforce.',
    tags: ['Education', 'Seniors', 'Employment', 'Skills'],
    issueArea: 'education',
    url: 'https://www.skillsfuture.gov.sg/grants',
  },
];

async function main() {
  console.log('🌱 Seeding sample grants...');

  const now = new Date();
  
  // Insert sample grants
  for (const grant of sampleGrants) {
    try {
      await db.insert(schema.grants).values({
        title: grant.title,
        agency: grant.agency,
        amount: grant.amount,
        amountMin: grant.amountMin,
        amountMax: grant.amountMax,
        deadline: grant.deadline,
        description: grant.description,
        tags: JSON.stringify(grant.tags),
        issueArea: grant.issueArea,
        url: grant.url,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`✅ Added: ${grant.title.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Failed: ${grant.title}`, error);
    }
  }

  console.log(`\n✅ Seeded ${sampleGrants.length} sample grants!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
