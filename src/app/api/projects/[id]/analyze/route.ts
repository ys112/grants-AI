/**
 * AI Analysis API
 * 
 * Provides AI-powered gap analysis between a project and a grant using Gemini.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// POST /api/projects/[id]/analyze - AI gap analysis for a project-grant pair
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { grantId } = body;

    if (!grantId) {
      return NextResponse.json({ error: "grantId is required" }, { status: 400 });
    }

    if (!genAI) {
      return NextResponse.json(
        { error: "AI analysis unavailable - GEMINI_API_KEY not configured" },
        { status: 503 }
      );
    }

    // Fetch project
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch grant
    const grant = await prisma.grant.findUnique({
      where: { id: grantId },
    });

    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    // Parse JSON fields
    const projectFocusAreas = JSON.parse(project.focusAreas || "[]");
    const projectDeliverables = JSON.parse(project.deliverables || "[]");
    const grantTags = JSON.parse(grant.tags || "[]");

    // Build context for Gemini
    const prompt = `You are an expert grant advisor helping non-profit organizations improve their grant applications.

## Project Details
**Name:** ${project.name}
**Description:** ${project.description}
**Target Population:** ${project.targetPopulation}
**Focus Areas:** ${projectFocusAreas.join(", ")}
**Expected Deliverables:** ${projectDeliverables.join(", ") || "Not specified"}
**Expected Outcomes:** ${project.expectedOutcomes || "Not specified"}
**Funding Needed:** $${project.fundingMin?.toLocaleString() || "?"} - $${project.fundingMax?.toLocaleString() || "?"}

## Grant Details
**Name:** ${grant.title}
**Agency:** ${grant.agency}
**Description:** ${grant.description}
**Objectives:** ${grant.objectives || "Not specified"}
**Eligibility:** ${grant.whoCanApply || "Not specified"}
**Funding Available:** ${grant.fundingInfo || grant.amount || "Not specified"}
**Focus Areas:** ${grantTags.join(", ")}
**Required Documents:** ${grant.requiredDocs || "Not specified"}
**Deadline:** ${grant.deadline?.toLocaleDateString() || "Not specified"}

---

Provide a detailed analysis with the following sections:

1. **Match Assessment** (2-3 sentences): Overall how well does this project align with the grant?

2. **Strengths** (bullet points): What aspects of the project align well with the grant requirements?

3. **Gaps Identified** (bullet points): What's missing or could be improved?

4. **Recommendations** (bullet points): Specific, actionable steps to strengthen the application.

5. **Application Tips** (bullet points): Key things to emphasize or highlight in the application.

Format your response as JSON with keys: matchAssessment, strengths (array), gaps (array), recommendations (array), tips (array).`;

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from response (handle markdown code blocks)
    let analysis;
    try {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                        responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      analysis = JSON.parse(jsonStr);
    } catch {
      analysis = {
        matchAssessment: responseText.substring(0, 500),
        strengths: [],
        gaps: [],
        recommendations: [],
        tips: [],
        raw: responseText,
      };
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
      },
      grant: {
        id: grant.id,
        title: grant.title,
        agency: grant.agency,
      },
      analysis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating AI analysis:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate analysis: ${errorMessage}` },
      { status: 500 }
    );
  }
}
