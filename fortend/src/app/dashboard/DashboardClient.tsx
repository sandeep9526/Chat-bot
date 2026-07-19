"use client";

import dynamic from "next/dynamic";

// Dashboard is a browser-only tool (fetches the backend live) → load
// client-side, no SSR.
const AdminDashboard = dynamic(
  () => import("@/components/admin/AdminDashboard").then((m) => m.AdminDashboard),
  { ssr: false },
);

export function DashboardClient() {
  return <AdminDashboard />;
}
