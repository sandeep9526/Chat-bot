import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { Pool } from "pg";

/**
 * Social sign-in providers, wired conditionally: a provider only appears in
 * `socialProviders` (and its sign-in button becomes usable) once its env
 * vars are actually set. Nothing here works until real OAuth app
 * credentials exist for each provider — that's a manual step per provider,
 * not something that can be generated. For each one:
 *
 * - Google:   console.cloud.google.com → APIs & Services → Credentials
 * - GitHub:   github.com/settings/developers → OAuth Apps
 * - LinkedIn: linkedin.com/developers/apps
 * - Facebook (used for "Meta" login — Meta doesn't expose a separate
 *   consumer OAuth product; Facebook Login is what that means in practice):
 *   developers.facebook.com/apps
 * - Twitter/X: developer.twitter.com/en/portal/dashboard
 * - Apple: developer.apple.com → Certificates, IDs & Profiles → Keys.
 *   IMPORTANT: unlike the others, Apple's "client secret" is not a static
 *   string — it's a JWT you sign yourself using your Apple-issued private
 *   key, team ID, and key ID, and it expires (max 6 months) and must be
 *   regenerated periodically. APPLE_CLIENT_SECRET below must already be
 *   that signed JWT — Better Auth does not generate it for you.
 *
 * Redirect/callback URI to register with every provider:
 *   {BETTER_AUTH_URL}/api/auth/callback/<provider>
 *   e.g. http://localhost:3000/api/auth/callback/google in dev.
 */
const socialProviders: NonNullable<Parameters<typeof betterAuth>[0]["socialProviders"]> = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : {}),
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? { github: { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET } }
    : {}),
  ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
    ? { linkedin: { clientId: process.env.LINKEDIN_CLIENT_ID, clientSecret: process.env.LINKEDIN_CLIENT_SECRET } }
    : {}),
  ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
    ? { facebook: { clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET } }
    : {}),
  ...(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET
    ? { twitter: { clientId: process.env.TWITTER_CLIENT_ID, clientSecret: process.env.TWITTER_CLIENT_SECRET } }
    : {}),
  ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
    ? { apple: { clientId: process.env.APPLE_CLIENT_ID, clientSecret: process.env.APPLE_CLIENT_SECRET } }
    : {}),
};

/**
 * Better Auth server configuration.
 *
 * This runs inside Next.js and handles:
 * - User sign-up/sign-in
 * - Session management
 * - JWT token generation (for FastAPI backend)
 * - JWKS endpoint for token verification
 */
export const auth = betterAuth({
  // Database: Postgres (Neon) — shared with the FastAPI backend's tables so
  // bots.owner_user_id can reference this user table directly.
  database: new Pool({ connectionString: process.env.DATABASE_URL }),

  // Google/GitHub/LinkedIn/Facebook("Meta")/Twitter("X")/Apple — each only
  // active once its own env vars are set (see the definition above).
  socialProviders,

  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // automatically sign in after registration
  },

  // JWT plugin - enables JWT tokens for FastAPI backend
  plugins: [
    jwt({
      // JWT issuer and audience - must match what FastAPI expects
      jwt: {
        issuer: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        audience: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        expirationTime: "15m", // tokens expire after 15 minutes
      },
    }),
  ],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh every 24 hours
  },

  // Trusted origins for CORS
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  ],
});
