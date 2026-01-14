import { NextResponse } from 'next/server';
import { db } from '@/db';
import { trackedGrants, grants } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';

// Ensure Node.js runtime for database access
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
    const existing = await db.select()
      .from(trackedGrants)
      .where(
        and(
          eq(trackedGrants.userId, session.user.id),
          eq(trackedGrants.grantId, grantId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Grant is already tracked' },
        { status: 400 }
      );
    }

    // Create tracked grant
    const [trackedGrant] = await db.insert(trackedGrants)
      .values({
        userId: session.user.id,
        grantId,
        status: 'new',
      })
      .returning();

    // Fetch the associated grant
    const [grant] = await db.select()
      .from(grants)
      .where(eq(grants.id, grantId))
      .limit(1);

    return NextResponse.json({ ...trackedGrant, grant }, { status: 201 });
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

    await db.delete(trackedGrants)
      .where(
        and(
          eq(trackedGrants.userId, session.user.id),
          eq(trackedGrants.grantId, grantId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error untracking grant:', error);
    return NextResponse.json(
      { error: 'Failed to untrack grant' },
      { status: 500 }
    );
  }
}
