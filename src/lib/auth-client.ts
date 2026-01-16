import { createAuthClient } from "better-auth/react";

// Get the base URL for Better Auth client
const getBaseURL = (): string => {
  if (process.env.BETTER_AUTH_URL) {
    return `https://${process.env.BETTER_AUTH_URL}`;
  }

  const public_url = process.env.NEXT_PUBLIC_VERCEL_URL
  if (public_url) {
    return `https://${public_url}`;
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
