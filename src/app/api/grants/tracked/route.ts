import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Ensure Node.js runtime for Prisma database access
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const trackedGrants = await prisma.trackedGrant.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        grant: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform for API response
    const response = trackedGrants.map((tracked) => ({
      id: tracked.id,
      grantId: tracked.grant.id,
      title: tracked.grant.title,
      agency: tracked.grant.agency,
      amount: tracked.grant.amount,
      deadline: tracked.grant.deadline.toISOString(),
      status: tracked.status,
      notes: tracked.notes,
      createdAt: tracked.createdAt.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching tracked grants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracked grants' },
      { status: 500 }
    );
  }
}
