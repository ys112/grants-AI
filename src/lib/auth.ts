import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

// Server-side base URL for Better Auth
const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) {
    return `https://${process.env.BETTER_AUTH_URL}`;
  }

  // Vercel auto-sets VERCEL_URL for all deployments (server-side only)
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
  
  // Add Vercel URL if available
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  // // Add production domain if different
  // if (process.env.NEXT_PUBLIC_VERCEL_URL) {
  //   origins.push(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`);
  // }
  
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
});
