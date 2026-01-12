import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const grants = await prisma.grant.findMany({
      orderBy: {
        deadline: 'asc',
      },
    });

    // Transform grants for API response
    const grantsWithParsedTags = grants.map((grant) => ({
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
