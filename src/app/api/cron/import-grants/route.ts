/**
 * Cron endpoint for weekly grant import
 * Triggered by Vercel Cron every Sunday at 2:00 AM UTC
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

// API endpoints
const GRANTS_LIST_URL = 'https://oursggrants.gov.sg/api/v1/grant_metadata/explore_grants';
const GRANT_DETAILS_URL = 'https://oursggrants.gov.sg/api/v1/grant_instruction';

// Verify cron secret (optional but recommended)
const CRON_SECRET = process.env.CRON_SECRET;

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

function parseGuidelineHtml(html: string) {
  const text = html || '';
  
  const sections = {
    objectives: '',
    whoCanApply: '',
    whenToApply: '',
    fundingInfo: '',
  };
  
  const whoMatch = text.match(/who can apply\??([\\s\\S]*?)(?=when|how much|$)/i);
  if (whoMatch) {
    sections.whoCanApply = stripHtml(whoMatch[1]).substring(0, 2000);
  }
  
  const whenMatch = text.match(/when (?:can i|to) apply\??([\\s\\S]*?)(?=how much|who|$)/i);
  if (whenMatch) {
    sections.whenToApply = stripHtml(whenMatch[1]).substring(0, 1000);
  }
  
  const fundingMatch = text.match(/how much funding[^?]*\??([\\s\\S]*?)(?=who|when|$)/i);
  if (fundingMatch) {
    sections.fundingInfo = stripHtml(fundingMatch[1]).substring(0, 1000);
  }
  
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
  
  const cleaned = html.replace(/<div style="display:none">[\s\S]*?<\/div>/gi, '');
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

function parseClosingDate(closingDates: Record<string, string>): Date {
  const orgDate = closingDates?.organisation || closingDates?.individual;
  
  if (!orgDate || orgDate.toLowerCase().includes('open for')) {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    return futureDate;
  }
  
  const parsed = new Date(orgDate);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  return futureDate;
}

function parseAmount(amountVal: unknown): { min: number | null; max: number | null } {
  if (!amountVal) return { min: null, max: null };
  
  const amountStr = typeof amountVal === 'string' ? amountVal : String(amountVal);
  const numbers = amountStr.match(/[\d,]+/g);
  if (!numbers) return { min: null, max: null };
  
  const parsed = numbers.map(n => parseInt(n.replace(/,/g, ''), 10));
  
  if (parsed.length >= 2) {
    return { min: Math.min(...parsed), max: Math.max(...parsed) };
  } else if (parsed.length === 1) {
    if (amountStr.toLowerCase().includes('up to')) {
      return { min: null, max: parsed[0] };
    }
    return { min: parsed[0], max: parsed[0] };
  }
  
  return { min: null, max: null };
}

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
}

interface GrantDetails {
  guideline_html: string;
  template_html: string;
  email: string;
  phone: number | string;
  address: string;
  end_date: string | null;
}

async function fetchGrantDetails(grantValue: string): Promise<GrantDetails | null> {
  try {
    const url = `${GRANT_DETAILS_URL}/${grantValue}/?page_type=instruction&user_type=`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret if configured
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  
  // Initialize Prisma
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // Fetch grants list
    const response = await fetch(GRANTS_LIST_URL);
    const data = await response.json();
    const grants: RawGrant[] = data.grant_metadata;

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const grant of grants) {
      // Only process green (open) grants
      if (grant.status !== 'green') {
        skipped++;
        continue;
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 300));
      const details = await fetchGrantDetails(grant.value);

      const parsedGuideline = details ? parseGuidelineHtml(details.guideline_html) : {
        objectives: '',
        whoCanApply: '',
        whenToApply: '',
        fundingInfo: '',
      };

      const requiredDocs = details ? parseTemplateHtml(details.template_html) : [];
      const deadline = parseClosingDate(grant.closing_dates);
      const { min: amountMin, max: amountMax } = parseAmount(grant.grant_amount);
      const grantUrl = `https://oursggrants.gov.sg/grants/${grant.value}`;

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
        objectives: parsedGuideline.objectives || null,
        whoCanApply: parsedGuideline.whoCanApply || null,
        whenToApply: parsedGuideline.whenToApply || null,
        fundingInfo: parsedGuideline.fundingInfo || null,
        requiredDocs: requiredDocs.length > 0 ? JSON.stringify(requiredDocs) : null,
        guidelineHtml: details?.guideline_html || null,
        templateHtml: details?.template_html || null,
        email: details?.email || null,
        phone: details?.phone?.toString() || null,
        address: details?.address ? stripHtml(details.address) : null,
        scrapedAt: new Date(),
      };

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
        } else {
          await prisma.grant.create({
            data: {
              ...grantData,
              sourceId: grant.id,
            },
          });
          imported++;
        }
      } catch (error) {
        console.error(`Failed to import ${grant.name}:`, error);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      summary: {
        total: grants.length,
        imported,
        updated,
        skipped,
        durationSeconds: parseFloat(duration),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Import failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Vercel Cron requires max duration for long-running jobs
export const maxDuration = 300; // 5 minutes
