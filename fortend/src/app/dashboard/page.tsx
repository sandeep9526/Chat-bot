import type { Metadata } from "next";
import { DashboardClient } from "./DashboardClient";

// SSG shell — the dashboard itself is client-only (fetches the backend live).
export const metadata: Metadata = {
  title: "Zeva · Dashboard",
  description: "Leads, chats, and knowledge for your Zeva bot.",
};

export default function DashboardPage() {
  // No outer <main> here — AppShell (inside DashboardClient) renders its own
  // <main> for the content region, and two <main> landmarks is invalid a11y.
  return <DashboardClient />;
}
