import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

/**
 * Better Auth client for React/Next.js frontend.
 * 
 * This client provides:
 * - signIn/signUp methods
 * - Session management (useSession hook)
 * - JWT token retrieval for FastAPI backend
 */
export const authClient = createAuthClient({
  // Base URL of the auth server (same as Next.js app)
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  plugins: [
    jwtClient(), // enables authClient.token() for JWT retrieval
  ],
});

// Export commonly used methods
export const { signIn, signUp, signOut, useSession } = authClient;
