import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
};

// Safe with no Sentry project configured — this only adds build-time
// source-map upload (needs SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN once
// a real Sentry project exists; harmless no-op without them) on top of the
// runtime init in src/instrumentation.ts / src/instrumentation-client.ts.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
});
