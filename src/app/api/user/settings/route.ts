import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth'; // Adjust this path based on your auth setup
import { headers } from 'next/headers';

export async function PATCH(req: Request) {
    try {
        // 1. Get the current user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 2. Parse the request body
        const body = await req.json();
        const { interests, targetPopulation, minFunding } = body;

        // 3. Update the database
        const updatedUser = await prisma.user.update({
            where: {
                email: session.user.email,
            },
            data: {
                interests,
                targetPopulation,
                minFunding,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("[SETTINGS_PATCH_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}