/**
 * Cron endpoint for deadline notification emails
 * Triggered by Vercel Cron daily at 8:00 AM UTC
 * Sends email alerts when tracked grants have deadlines within 7 days
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Resend } from "resend";

// Verify cron secret (optional but recommended)
const CRON_SECRET = process.env.CRON_SECRET;
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender address (must be verified in Resend)
const FROM_EMAIL = process.env.FROM_EMAIL || "notifications@grantsync.app";

interface TrackedGrantWithDetails {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  grant: {
    id: string;
    title: string;
    agency: string;
    deadline: Date | null;
    url: string | null;
  };
}

function formatDeadline(deadline: Date): string {
  const days = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "TODAY";
  if (days === 1) return "Tomorrow";
  return `${days} days left`;
}

function generateEmailHtml(
  userName: string,
  grants: TrackedGrantWithDetails[]
): string {
  const grantRows = grants
    .map((g) => {
      const deadline = g.grant.deadline ? formatDeadline(g.grant.deadline) : "No deadline";
      const urgencyColor = g.grant.deadline && 
        Math.ceil((g.grant.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 3
          ? "#dc3545"
          : "#ffc107";
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${g.grant.title}</strong><br/>
            <span style="color: #666; font-size: 14px;">${g.grant.agency}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
            <span style="background: ${urgencyColor}; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 13px;">
              ${deadline}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
            ${g.grant.url 
              ? `<a href="${g.grant.url}" style="color: #4ECDC4;">View Grant</a>` 
              : "-"
            }
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #0A1929 0%, #132F4C 100%); padding: 24px; text-align: center;">
          <h1 style="color: #4ECDC4; margin: 0; font-size: 24px;">⏰ Deadline Alert</h1>
        </div>
        <div style="padding: 24px;">
          <p style="color: #333; font-size: 16px;">
            Hi ${userName || "there"},
          </p>
          <p style="color: #333; font-size: 16px;">
            You have <strong>${grants.length} tracked grant${grants.length > 1 ? "s" : ""}</strong> with approaching deadlines:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Grant</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Deadline</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Link</th>
              </tr>
            </thead>
            <tbody>
              ${grantRows}
            </tbody>
          </table>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://grants-ai-three.vercel.app"}/dashboard/tracked" 
               style="display: inline-block; background: #4ECDC4; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
              View All Tracked Grants
            </a>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 16px; text-align: center; font-size: 13px; color: #666;">
          <p style="margin: 0;">
            This email was sent by GrantSync. <br/>
            You're receiving this because you have tracked grants with upcoming deadlines.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function GET(request: NextRequest) {
  // Verify cron secret if configured
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for Resend API key
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 }
    );
  }

  const startTime = Date.now();

  // Initialize Prisma
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // Notification milestones (days before deadline)
    const NOTIFY_ON_DAYS = [14, 7, 5, 3];
    
    // Calculate date range (now to 14 days from now to capture all milestone candidates)
    const now = new Date();
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

    // Query tracked grants with deadlines within 14 days
    const allTrackedGrants = await prisma.trackedGrant.findMany({
      where: {
        grant: {
          deadline: {
            gte: now,
            lte: fourteenDaysFromNow,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        grant: {
          select: {
            id: true,
            title: true,
            agency: true,
            deadline: true,
            url: true,
          },
        },
      },
    }) as TrackedGrantWithDetails[];

    // Filter to only grants with exactly 14, 7, 5, or 3 days left
    const urgentTrackedGrants = allTrackedGrants.filter((tracked) => {
      if (!tracked.grant.deadline) return false;
      const daysLeft = Math.ceil(
        (tracked.grant.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return NOTIFY_ON_DAYS.includes(daysLeft);
    });

    if (urgentTrackedGrants.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No grants hitting notification milestones today (14, 7, 5, or 3 days)",
        emailsSent: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Group by user
    const grantsByUser = urgentTrackedGrants.reduce(
      (acc, tracked) => {
        const userId = tracked.user.id;
        if (!acc[userId]) {
          acc[userId] = {
            user: tracked.user,
            grants: [],
          };
        }
        acc[userId].grants.push(tracked);
        return acc;
      },
      {} as Record<string, { user: TrackedGrantWithDetails["user"]; grants: TrackedGrantWithDetails[] }>
    );

    // Send emails
    let emailsSent = 0;
    const errors: string[] = [];

    for (const { user, grants } of Object.values(grantsByUser)) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: `⏰ ${grants.length} Grant${grants.length > 1 ? "s" : ""} with Approaching Deadline${grants.length > 1 ? "s" : ""}`,
          html: generateEmailHtml(user.name, grants),
        });
        emailsSent++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Failed to send to ${user.email}: ${errorMessage}`);
        console.error(`Failed to send email to ${user.email}:`, error);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      summary: {
        totalUrgentGrants: urgentTrackedGrants.length,
        uniqueUsers: Object.keys(grantsByUser).length,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
        durationSeconds: parseFloat(duration),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Deadline notification cron failed:", error);
    return NextResponse.json(
      {
        error: "Notification job failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Vercel Cron requires max duration for long-running jobs
export const maxDuration = 60; // 1 minute should be plenty
