import { createAuthClient } from "better-auth/react";

// Get the base URL for Better Auth client
// Uses window.location.origin on client-side (works for all environments)
const getBaseURL = (): string => {
  // Must check if window exists first (SSR safety)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const public_url = process.env.NEXT_PUBLIC_VERCEL_URL 
  if (public_url) {
    return `https://${public_url}`;
  }

  // SSR fallback
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
