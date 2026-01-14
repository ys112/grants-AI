import { NextResponse } from 'next/server';
import { db } from '@/db';
import { grants } from '@/db/schema';
import { asc } from 'drizzle-orm';

// Ensure Node.js runtime for database access
export const runtime = 'nodejs';

export async function GET() {
  try {
    const allGrants = await db.select().from(grants).orderBy(asc(grants.deadline));

    // Transform grants for API response
    const grantsWithParsedTags = allGrants.map((grant) => ({
      ...grant,
      tags: JSON.parse(grant.tags),
      deadline: grant.deadline.toISOString(),
    }));

    return NextResponse.json(grantsWithParsedTags);
  } catch (error) {
    console.error('Error fetching grants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grants' },
      { status: 500 }
    );
  }
}
