import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all grants and extract unique tags
    const grants = await prisma.grant.findMany({
      select: {
        tags: true,
      },
    });

    // Parse tags from JSON strings and collect unique ones
    const allTags = new Set<string>();
    grants.forEach((grant) => {
      try {
        const parsed = JSON.parse(grant.tags);
        if (Array.isArray(parsed)) {
          parsed.forEach((tag: string) => allTags.add(tag));
        }
      } catch {
        // Skip invalid JSON
      }
    });

    // Sort alphabetically
    const sortedTags = Array.from(allTags).sort();

    return NextResponse.json({ tags: sortedTags });
  } catch (error) {
    console.error('[GET_TAGS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
