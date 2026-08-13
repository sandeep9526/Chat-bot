import { NextResponse } from "next/server";

// Reports which social providers are actually configured (booleans only —
// never the credentials themselves). Mirrors the exact same condition used
// in src/lib/auth.ts's socialProviders object, so the sign-in/sign-up UI can
// show buttons only for providers that will actually work, instead of 6
// buttons where most currently fail with "not configured".
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    linkedin: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
    facebook: Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
    twitter: Boolean(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
    apple: Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
  });
}
