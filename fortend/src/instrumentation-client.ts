// Browser-side Sentry init — Next.js loads this automatically (the
// `instrumentation-client` filename is a Next.js convention, not something
// wired up manually elsewhere). Same no-op-with-no-DSN contract as
// src/instrumentation.ts.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
});

// Required export for the SDK to instrument client-side route transitions
// (App Router navigations) — without it, `next build` emits an "ACTION
// REQUIRED" warning and navigation spans aren't captured.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
