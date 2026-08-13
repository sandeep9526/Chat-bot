"use client";

import dynamic from "next/dynamic";

// Platform-only, browser-only tool → load client-side, no SSR.
const SuperadminDashboard = dynamic(
  () => import("@/components/superadmin/SuperadminDashboard").then((m) => m.SuperadminDashboard),
  { ssr: false },
);

export function AdminClient() {
  return <SuperadminDashboard />;
}
