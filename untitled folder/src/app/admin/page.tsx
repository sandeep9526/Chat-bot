import type { Metadata } from "next";
import { AdminClient } from "./AdminClient";

// SSG shell — the panel itself is client-only (fetches the backend live).
export const metadata: Metadata = {
  title: "ochreshift · Platform Admin",
  description: "Every client and agent on the ochreshift platform.",
};

export default function AdminPage() {
  // No outer <main> here — AppShell (inside AdminClient) renders its own <main>
  // for the content region, and two <main> landmarks per page is invalid a11y.
  return <AdminClient />;
}
