import { createAuthClient } from "better-auth/react";

// Dynamically determine the base URL for Better Auth
// 1. Use NEXT_PUBLIC_APP_URL if explicitly set (production)
// 2. Use VERCEL_URL for preview deployments
// 3. Fallback to localhost for local development
const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (typeof window !== "undefined") {
    // Client-side: use current origin
    return window.location.origin;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
