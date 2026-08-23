import type { ReactNode } from "react";
import Link from "next/link";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";

/**
 * Single-column centered auth layout per design requirements.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5 py-12 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-1/2 top-0 -ml-[50vw] h-[50vw] w-[100vw] bg-[radial-gradient(ellipse_at_top,var(--accent-soft),transparent_50%)]" />
      
      <div className="w-full max-w-[420px] relative z-10">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center"
        >
          <OchreshiftLogo className="h-10 w-auto" variant="default" />
        </Link>
        
        <div className="rounded-[24px] border border-border bg-surface p-8 shadow-2xl sm:p-10 text-fg">
          {children}
        </div>
      </div>
    </div>
  );
}
