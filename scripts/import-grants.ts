/**
 * Grant Import Script
 * 
 * Fetches grants from OurSG API, parses HTML content, and stores in database.
 * Can be run as a cron job for periodic updates.
 * 
 * Usage: npx tsx scripts/import-grants.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

// Initialize Prisma with adapter
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// API endpoints
const GRANTS_LIST_URL = 'https://oursggrants.gov.sg/api/v1/grant_metadata/explore_grants';
const GRANT_DETAILS_URL = 'https://oursggrants.gov.sg/api/v1/grant_instruction';

// Types
interface RawGrant {
  id: string;
  name: string;
  desc: string;
  value: string;
  agency_name: string;
  status: string;
  applicable_to: string[];
  explorable_categories: string[];
  deliverables: string[];
  grant_amount: string | null;
  closing_dates: Record<string, string>;
  grants_details?: GrantDetails;
}

interface GrantDetails {
  guideline_html: string;
  template_html: string;
  email: string;
  phone: number | string;
  address: string;
  end_date: string | null;
}

// HTML Parsing utilities
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\\n/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseGuidelineHtml(html: string): {
  objectives: string;
  whoCanApply: string;
  whenToApply: string;
  fundingInfo: string;
} {
  const text = html || '';
  
  // Extract sections based on common headers
  const sections = {
    objectives: '',
    whoCanApply: '',
    whenToApply: '',
    fundingInfo: '',
  };
  
  // Find "Who can apply" section
  const whoMatch = text.match(/who can apply\??([\s\S]*?)(?=when|how much|$)/i);
  if (whoMatch) {
    sections.whoCanApply = stripHtml(whoMatch[1]).substring(0, 2000);
  }
  
  // Find "When to apply" section
  const whenMatch = text.match(/when (?:can i|to) apply\??([\s\S]*?)(?=how much|who|$)/i);
  if (whenMatch) {
    sections.whenToApply = stripHtml(whenMatch[1]).substring(0, 1000);
  }
  
  // Find "How much funding" section
  const fundingMatch = text.match(/how much funding[^?]*\??([\s\S]*?)(?=who|when|$)/i);
  if (fundingMatch) {
    sections.fundingInfo = stripHtml(fundingMatch[1]).substring(0, 1000);
  }
  
  // Everything before first heading is objectives
  const firstHeading = text.search(/who can apply|when (?:can|to) apply|how much/i);
  if (firstHeading > 0) {
    sections.objectives = stripHtml(text.substring(0, firstHeading)).substring(0, 2000);
  } else {
    sections.objectives = stripHtml(text).substring(0, 2000);
  }
  
  return sections;
}

function parseTemplateHtml(html: string): string[] {
  if (!html) return [];
  
  // Remove hidden divs
  const cleaned = html.replace(/<div style="display:none">[\s\S]*?<\/div>/gi, '');
  
  // Extract document names from <li> tags
  const docs: string[] = [];
  const liPattern = /<li[^>]*>(?:<a[^>]*>)?([^<]+)/gi;
  let match;
  
  while ((match = liPattern.exec(cleaned)) !== null) {
    const doc = match[1].trim();
    if (doc && doc.length > 3 && !doc.includes('style=')) {
      docs.push(doc);
    }
  }
  
  return docs;
}

function parseClosingDate(closingDates: Record<string, string>): Date | null {
  // Try to parse closing date, return null if "Open for Applications" or missing
  const orgDate = closingDates?.organisation || closingDates?.individual;
  
  if (!orgDate || orgDate.toLowerCase().includes('open for')) {
    // No deadline - return null
    return null;
  }
  
  // Try to parse date string (e.g., "31 Mar 2024")
  const parsed = new Date(orgDate);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  // Could not parse - return null
  return null;
}

function parseAmount(amountVal: unknown): { min: number | null; max: number | null } {
  if (!amountVal) return { min: null, max: null };
  
  // Convert to string if not already
  const amountStr = typeof amountVal === 'string' ? amountVal : String(amountVal);
  
  // Extract numbers from string like "$50,000 - $100,000" or "Up to $20,000"
  const numbers = amountStr.match(/[\d,]+/g);
  if (!numbers) return { min: null, max: null };
  
  const parsed = numbers.map(n => parseInt(n.replace(/,/g, ''), 10));
  
  if (parsed.length >= 2) {
    return { min: Math.min(...parsed), max: Math.max(...parsed) };
  } else if (parsed.length === 1) {
    // "Up to $X" means max is X
    if (amountStr.toLowerCase().includes('up to')) {
      return { min: null, max: parsed[0] };
    }
    return { min: parsed[0], max: parsed[0] };
  }
  
  return { min: null, max: null };
}

async function fetchGrantDetails(grantValue: string): Promise<GrantDetails | null> {
  try {
    const url = `${GRANT_DETAILS_URL}/${grantValue}/?page_type=instruction&user_type=`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch details for ${grantValue}:`, error);
    return null;
  }
}

async function importGrants() {
  console.log('🚀 Starting grant import...');
  const startTime = Date.now();
  
  // Fetch grants list
  console.log('📥 Fetching grants list from API...');
  const response = await fetch(GRANTS_LIST_URL);
  const data = await response.json();
  const grants: RawGrant[] = data.grant_metadata;
  
  console.log(`📋 Found ${grants.length} grants`);
  
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const grant of grants) {
    // Only process green (open) grants
    if (grant.status !== 'green') {
      skipped++;
      continue;
    }
    
    // Fetch details with rate limiting
    await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
    const details = await fetchGrantDetails(grant.value);
    
    // Parse HTML sections
    const parsedGuideline = details ? parseGuidelineHtml(details.guideline_html) : {
      objectives: '',
      whoCanApply: '',
      whenToApply: '',
      fundingInfo: '',
    };
    
    const requiredDocs = details ? parseTemplateHtml(details.template_html) : [];
    const deadline = parseClosingDate(grant.closing_dates);
    const { min: amountMin, max: amountMax } = parseAmount(grant.grant_amount);
    
    // Build grant URL
    const grantUrl = `https://oursggrants.gov.sg/grants/${grant.value}`;
    
    // Prepare data
    const grantData = {
      title: grant.name,
      agency: grant.agency_name,
      description: grant.desc,
      amount: grant.grant_amount ? String(grant.grant_amount) : 'Varies',
      amountMin,
      amountMax,
      deadline,
      url: grantUrl,
      tags: JSON.stringify(grant.explorable_categories || []),
      status: grant.status,
      applicableTo: JSON.stringify(grant.applicable_to || ['organisation']),
      deliverables: JSON.stringify(grant.deliverables || []),
      
      // Parsed sections
      objectives: parsedGuideline.objectives || null,
      whoCanApply: parsedGuideline.whoCanApply || null,
      whenToApply: parsedGuideline.whenToApply || null,
      fundingInfo: parsedGuideline.fundingInfo || null,
      requiredDocs: requiredDocs.length > 0 ? JSON.stringify(requiredDocs) : null,
      
      // Raw HTML
      guidelineHtml: details?.guideline_html || null,
      templateHtml: details?.template_html || null,
      
      // Contact
      email: details?.email || null,
      phone: details?.phone?.toString() || null,
      address: details?.address ? stripHtml(details.address) : null,
      
      // Metadata
      scrapedAt: new Date(),
    };
    
    // Upsert grant
    try {
      const existing = await prisma.grant.findUnique({
        where: { sourceId: grant.id },
      });
      
      if (existing) {
        await prisma.grant.update({
          where: { sourceId: grant.id },
          data: grantData,
        });
        updated++;
        console.log(`✏️  Updated: ${grant.name}`);
      } else {
        await prisma.grant.create({
          data: {
            ...grantData,
            sourceId: grant.id,
          },
        });
        imported++;
        console.log(`✅ Imported: ${grant.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to import ${grant.name}:`, error);
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n📊 Import Summary:');
  console.log(`   ✅ New: ${imported}`);
  console.log(`   ✏️  Updated: ${updated}`);
  console.log(`   ⏭️  Skipped (non-green): ${skipped}`);
  console.log(`   ⏱️  Duration: ${duration}s`);
}

// Run import
importGrants()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
