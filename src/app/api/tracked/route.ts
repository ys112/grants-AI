import { NextResponse } from 'next/server';
import { db } from '@/db';
import { trackedGrants, grants } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';

// Ensure Node.js runtime for database access
export const runtime = 'nodejs';

// GET - Fetch all tracked grants for the current user
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

    const startTime = performance.now();

    // Fetch tracked grants with grant details
    const userTrackedGrants = await db.query.trackedGrants.findMany({
      where: eq(trackedGrants.userId, session.user.id),
      with: {
        grant: true,
      },
    });

    const endTime = performance.now();
    console.log(`[API Performance] GET /api/tracked: ${(endTime - startTime).toFixed(2)}ms`);

    // Transform for response
    const result = userTrackedGrants.map((tg) => ({
      id: tg.id,
      grantId: tg.grantId,
      status: tg.status,
      notes: tg.notes,
      createdAt: tg.createdAt,
      updatedAt: tg.updatedAt,
      grant: {
        ...tg.grant,
        tags: JSON.parse(tg.grant.tags),
        deadline: tg.grant.deadline.toISOString(),
      },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching tracked grants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracked grants' },
      { status: 500 }
    );
  }
}

// PUT - Update tracked grant status
export async function PUT(request: Request) {
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

    const { trackedGrantId, status, notes } = await request.json();

    if (!trackedGrantId) {
      return NextResponse.json(
        { error: 'Tracked grant ID is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['new', 'reviewing', 'applied', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const startTime = performance.now();

    // Update the tracked grant
    const updateData: { status?: string; notes?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const [updated] = await db
      .update(trackedGrants)
      .set(updateData)
      .where(
        and(
          eq(trackedGrants.id, trackedGrantId),
          eq(trackedGrants.userId, session.user.id)
        )
      )
      .returning();

    const endTime = performance.now();
    console.log(`[API Performance] PUT /api/tracked: ${(endTime - startTime).toFixed(2)}ms`);

    if (!updated) {
      return NextResponse.json(
        { error: 'Tracked grant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating tracked grant:', error);
    return NextResponse.json(
      { error: 'Failed to update tracked grant' },
      { status: 500 }
    );
  }
}
