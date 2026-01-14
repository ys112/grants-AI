import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

// Ensure Node.js runtime for database access
export const runtime = 'nodejs';

// GET - Fetch user preferences
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

    const [user] = await db
      .select({
        interests: users.interests,
        targetPopulation: users.targetPopulation,
        minFunding: users.minFunding,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const endTime = performance.now();
    console.log(`[API Performance] GET /api/user/preferences: ${(endTime - startTime).toFixed(2)}ms`);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      interests: user.interests ? JSON.parse(user.interests) : [],
      targetPopulation: user.targetPopulation || '',
      minFunding: user.minFunding || 0,
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT - Update user preferences
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

    const { interests, targetPopulation, minFunding } = await request.json();

    const startTime = performance.now();

    const [updated] = await db
      .update(users)
      .set({
        interests: interests ? JSON.stringify(interests) : null,
        targetPopulation: targetPopulation || null,
        minFunding: minFunding ? parseInt(minFunding) : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    const endTime = performance.now();
    console.log(`[API Performance] PUT /api/user/preferences: ${(endTime - startTime).toFixed(2)}ms`);

    return NextResponse.json({
      interests: updated.interests ? JSON.parse(updated.interests) : [],
      targetPopulation: updated.targetPopulation,
      minFunding: updated.minFunding,
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
