import type { Metadata } from "next";
import { OnboardingClient } from "./OnboardingClient";

// SSG shell — the wizard itself is client-only (session + live backend calls).
export const metadata: Metadata = {
  title: "ochreshift · Get your agent live",
  description: "Guided setup — name your bot, add documents, brand it, and grab your embed code.",
};

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <OnboardingClient />
    </main>
  );
}
