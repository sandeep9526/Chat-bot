// Next.js's own instrumentation hook (stable since Next 15) — runs once per
// server/edge runtime start. Sentry.init() with no DSN is a documented-safe
// no-op (verified against the backend's Python SDK; the JS SDK follows the
// same contract) — this file does nothing until SENTRY_DSN is set.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
  }
}

// Captures errors thrown during React Server Component rendering — Next.js
// calls this itself, nothing else needs to invoke it.
export const onRequestError = Sentry.captureRequestError;
