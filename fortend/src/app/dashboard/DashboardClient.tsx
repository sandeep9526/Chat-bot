"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { checkPlatformAdmin } from "@/lib/superadminApi";

import { LogoLoader } from "@/components/ui/PageLoader";

// Dashboard is a browser-only tool (fetches the backend live) → load
// client-side, no SSR.
const AdminDashboard = dynamic(
  () => import("@/components/admin/AdminDashboard").then((m) => m.AdminDashboard),
  { ssr: false },
);

export function DashboardClient() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Silently check if this user is a platform admin and redirect them.
    // Non-admins get a 403 from checkPlatformAdmin — we catch it and proceed normally.
    checkPlatformAdmin()
      .then(({ is_admin }) => {
        if (is_admin) {
          router.replace("/admin");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        // Not logged in yet, or backend down — show the normal dashboard
        setChecking(false);
      });
  }, [router]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4 text-[var(--muted)]">
          <LogoLoader />
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}
