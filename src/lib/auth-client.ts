import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// For client-side, we need to provide a proper URL
// Using a placeholder that will be overridden by the fetch interceptor
// Better Auth will use relative paths if we set the basePath
export const authClient = createAuthClient({
  // Use localhost as default - the actual fetch will use relative URLs
  // which automatically go to the current origin
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  plugins: [inferAdditionalFields({
    user: {
      interests: { type: "string" },
      targetPopulation: { type: "string" },
      minFunding: { type: "number" },
      role: { type: "string" },
      organizationId: { type: "string" },
      orgDescription: { type: "string" },
    }
  })]
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
