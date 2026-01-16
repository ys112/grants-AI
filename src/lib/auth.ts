import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

// Server-side base URL for Better Auth
const getBaseURL = () => {
  // Explicit URL (should already include https://)
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }

  // Vercel auto-sets VERCEL_URL (without https://)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Local development fallback
  return "http://localhost:3000";
};

// Get trusted origins for CORS
const getTrustedOrigins = () => {
  const origins: string[] = [
    "http://localhost:3000",
  ];

  // Add Vercel URL if available (preview deployments)
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  // Add explicit production domain if set
  if (process.env.BETTER_AUTH_URL) {
    origins.push(process.env.BETTER_AUTH_URL);
  }

  // Add any additional allowed origins
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  return origins;
};

export const auth = betterAuth({
  baseURL: getBaseURL(),
  trustedOrigins: getTrustedOrigins(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Simplified for hackathon
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    // Map your custom Prisma fields to the session user object
    additionalFields: {
      role: { type: "string" },
      interests: { type: "string" },
      targetPopulation: { type: "string" },
      minFunding: { type: "number" },
      organizationId: { type: "string" },
    }
  },
});
