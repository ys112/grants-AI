import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Ensure Node.js runtime for Prisma database access
export const runtime = 'nodejs';

export async function POST(request: Request) {
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

    const { grantId } = await request.json();

    if (!grantId) {
      return NextResponse.json(
        { error: 'Grant ID is required' },
        { status: 400 }
      );
    }

    // Check if already tracked
    const existing = await prisma.trackedGrant.findUnique({
      where: {
        userId_grantId: {
          userId: session.user.id,
          grantId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Grant is already tracked' },
        { status: 400 }
      );
    }

    const trackedGrant = await prisma.trackedGrant.create({
      data: {
        userId: session.user.id,
        grantId,
        status: 'new',
      },
      include: {
        grant: true,
      },
    });

    return NextResponse.json(trackedGrant, { status: 201 });
  } catch (error) {
    console.error('Error tracking grant:', error);
    return NextResponse.json(
      { error: 'Failed to track grant' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const grantId = searchParams.get('grantId');

    if (!grantId) {
      return NextResponse.json(
        { error: 'Grant ID is required' },
        { status: 400 }
      );
    }

    await prisma.trackedGrant.delete({
      where: {
        userId_grantId: {
          userId: session.user.id,
          grantId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error untracking grant:', error);
    return NextResponse.json(
      { error: 'Failed to untrack grant' },
      { status: 500 }
    );
  }
}
