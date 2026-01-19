import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getRecommendationsForProject,
  saveRecommendations,
} from "@/lib/recommendation-engine";

// POST /api/projects/[id]/recommend - Generate recommendations for a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const {
      maxResults = 10,
      minScore = 30,
    } = body;

    // Get the project
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if recommendations already exist (caching)
    const forceRefresh = body.forceRefresh === true;
    if (!forceRefresh) {
      const existingRecommendations = await prisma.projectRecommendation.findMany({
        where: { projectId: id },
        orderBy: { overallScore: "desc" },
        take: maxResults,
        include: { grant: true },
      });

      // Check if cache is still valid (no new grants since cache was created)
      if (existingRecommendations.length > 0) {
        const cacheDate = existingRecommendations[0].createdAt;
        
        // Check if any new grants were added after the cache
        const newGrantsCount = await prisma.grant.count({
          where: {
            createdAt: { gt: cacheDate },
            status: "green",
            applicableTo: { contains: "organisation" },
            deadline: { gte: new Date() },
          },
        });

        // Also check if project was updated after cache
        const projectUpdatedAfterCache = project.updatedAt > cacheDate;

        // Return cached with stored LLM scores
        if (newGrantsCount === 0 && !projectUpdatedAfterCache) {
          return NextResponse.json({
            project: { id: project.id, name: project.name },
            recommendations: existingRecommendations.map((rec) => {
              const deadline = rec.grant.deadline;
              const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const deadlineScore = rec.deadlineScore ?? (daysUntil <= 7 ? 100 : daysUntil <= 14 ? 80 : daysUntil <= 30 ? 60 : daysUntil <= 60 ? 40 : daysUntil <= 90 ? 30 : 20);

              return {
                grant: {
                  id: rec.grant.id,
                  title: rec.grant.title,
                  agency: rec.grant.agency,
                  amount: rec.grant.amount,
                  deadline: rec.grant.deadline,
                  description: rec.grant.description.substring(0, 200) + "...",
                  url: rec.grant.url,
                },
                scores: {
                  overall: rec.overallScore,
                  category: rec.categoryScore,
                  funding: rec.fundingScore,
                  deadline: deadlineScore,
                  semantic: rec.semanticScore ?? null,
                },
                llmScores: rec.llmPurpose != null ? {
                  purposeAlignment: rec.llmPurpose,
                  eligibilityFit: rec.llmEligibility,
                  impactRelevance: rec.llmImpact,
                  overall: rec.llmOverall,
                } : null,
                matchReason: rec.matchReason,
              };
            }),
            meta: {
              totalMatches: existingRecommendations.length,
              cached: true,
              cachedAt: cacheDate,
            },
          });
        }
        // Cache is stale, will recalculate below
      }
    }

    // Generate fresh recommendations
    const startTime = Date.now();
    const recommendations = await getRecommendationsForProject(project, {
      maxResults,
      minScore,
    });
    const processingTime = Date.now() - startTime;

    // Save to database
    if (recommendations.length > 0) {
      await saveRecommendations(project.id, recommendations);
    }

    // Format response (semantic scores now come from the engine)
    const response = {
      project: {
        id: project.id,
        name: project.name,
      },
      recommendations: recommendations.map((rec) => ({
        grant: {
          id: rec.grant.id,
          title: rec.grant.title,
          agency: rec.grant.agency,
          amount: rec.grant.amount,
          deadline: rec.grant.deadline,
          description: rec.grant.description.substring(0, 200) + "...",
          url: rec.grant.url,
        },
        scores: rec.scores,
        llmScores: rec.llmScores || null,
        matchReason: rec.matchReason,
      })),
      meta: {
        totalMatches: recommendations.length,
        processingTime: `${processingTime}ms`,
        cached: false,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/recommend - Get saved recommendations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get saved recommendations
    const recommendations = await prisma.projectRecommendation.findMany({
      where: { projectId: id },
      orderBy: { overallScore: "desc" },
      include: {
        grant: true,
      },
    });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
      },
      recommendations: recommendations.map((rec) => ({
        id: rec.id,
        status: rec.status,
        grant: {
          id: rec.grant.id,
          title: rec.grant.title,
          agency: rec.grant.agency,
          amount: rec.grant.amount,
          deadline: rec.grant.deadline,
          description: rec.grant.description.substring(0, 200) + "...",
          url: rec.grant.url,
        },
        scores: {
          overall: rec.overallScore,
          category: rec.categoryScore,
          funding: rec.fundingScore,
          deadline: rec.deadlineScore,
          semantic: rec.semanticScore,
        },
        llmScores: rec.llmPurpose != null ? {
          purposeAlignment: rec.llmPurpose,
          eligibilityFit: rec.llmEligibility,
          impactRelevance: rec.llmImpact,
          overall: rec.llmOverall,
        } : null,
        matchReason: rec.matchReason,
        createdAt: rec.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
