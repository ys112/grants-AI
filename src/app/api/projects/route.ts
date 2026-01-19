import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateProjectEmbeddings } from "@/lib/project-embeddings";

// GET /api/projects - List user's projects
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        recommendations: {
          take: 3,
          orderBy: { overallScore: "desc" },
          include: {
            grant: {
              select: {
                id: true,
                title: true,
                agency: true,
                amount: true,
                deadline: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      targetPopulation,
      focusAreas,
      deliverables,
      fundingMin,
      fundingMax,
      startDate,
      endDate,
      duration,
      expectedOutcomes,
      priority,
    } = body;

    // Validation
    if (!name || !description || !targetPopulation || !focusAreas) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, targetPopulation, focusAreas" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name,
        description,
        targetPopulation,
        focusAreas: JSON.stringify(focusAreas),
        deliverables: deliverables ? JSON.stringify(deliverables) : null,
        fundingMin: fundingMin ? parseInt(fundingMin) : null,
        fundingMax: fundingMax ? parseInt(fundingMax) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        duration: duration ? parseInt(duration) : null,
        expectedOutcomes,
        priority: priority || "medium",
      },
    });

    // Generate embeddings asynchronously (don't block response)
    generateProjectEmbeddings({
      id: project.id,
      description: project.description,
      targetPopulation: project.targetPopulation,
      expectedOutcomes: project.expectedOutcomes,
      deliverables: project.deliverables,
    }).catch(console.error);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
