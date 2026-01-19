/**
 * LLM-Enhanced Recommendation API
 * 
 * Uses Gemini to re-score recommendations with reasoning.
 * Call this after getting initial recommendations to improve accuracy.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { calculateLLMRelevance } from "@/lib/llm-relevance";

// POST /api/projects/[id]/recommend/enhance - Enhance recommendations with LLM
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
    const { grantIds } = body;

    if (!grantIds || !Array.isArray(grantIds) || grantIds.length === 0) {
      return NextResponse.json({ error: "grantIds required" }, { status: 400 });
    }

    // Get the project
    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get the grants
    const grants = await prisma.grant.findMany({
      where: { id: { in: grantIds } },
    });

    // Prepare project context
    const projectContext = {
      name: project.name,
      description: project.description,
      targetPopulation: project.targetPopulation,
      focusAreas: JSON.parse(project.focusAreas || "[]"),
      expectedOutcomes: project.expectedOutcomes,
      deliverables: JSON.parse(project.deliverables || "[]"),
    };

    // Calculate LLM scores for each grant
    const results: Record<string, {
      llmScores: {
        purposeAlignment: number;
        eligibilityFit: number;
        impactRelevance: number;
        overall: number;
      } | null;
      reasoning: string | null;
    }> = {};

    // Process sequentially to avoid rate limits
    for (const grant of grants) {
      const grantContext = {
        id: grant.id,
        title: grant.title,
        agency: grant.agency,
        description: grant.description,
        objectives: grant.objectives,
        whoCanApply: grant.whoCanApply,
        fundingInfo: grant.fundingInfo,
        tags: JSON.parse(grant.tags || "[]"),
      };

      const llmResult = await calculateLLMRelevance(projectContext, grantContext);
      
      results[grant.id] = {
        llmScores: llmResult ? {
          purposeAlignment: llmResult.purposeAlignment,
          eligibilityFit: llmResult.eligibilityFit,
          impactRelevance: llmResult.impactRelevance,
          overall: llmResult.overall,
        } : null,
        reasoning: llmResult?.reasoning || null,
      };

      // Brief delay between calls
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return NextResponse.json({
      project: { id: project.id, name: project.name },
      enhancedScores: results,
    });
  } catch (error) {
    console.error("Error enhancing recommendations:", error);
    return NextResponse.json(
      { error: "Failed to enhance recommendations" },
      { status: 500 }
    );
  }
}
