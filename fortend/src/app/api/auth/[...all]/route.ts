import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth API route handler.
 * 
 * This handles all auth-related requests:
 * - POST /api/auth/sign-in/email
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-out
 * - GET /api/auth/session
 * - GET /api/auth/jwks (for FastAPI JWT verification)
 * - POST /api/auth/token (get JWT for backend)
 */
export const { GET, POST } = toNextJsHandler(auth);
