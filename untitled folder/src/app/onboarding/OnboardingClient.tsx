"use client";

import dynamic from "next/dynamic";

// Client-only: reads the Better Auth session and talks to the backend.
const OnboardingWizard = dynamic(
  () => import("@/components/onboarding/OnboardingWizard").then((m) => m.OnboardingWizard),
  { ssr: false },
);

export function OnboardingClient() {
  return <OnboardingWizard />;
}
