import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Ensure Node.js runtime for Prisma database access (used by Better Auth)
export const runtime = 'nodejs';

export const { GET, POST } = toNextJsHandler(auth);
