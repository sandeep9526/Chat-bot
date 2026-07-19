import type { Metadata } from "next";
import Link from "next/link";
import { Studio } from "@/components/studio/Studio";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { WidgetThemeToggle } from "@/components/marketing/WidgetThemeToggle";

// SSG — static shell; interactivity is entirely client-side.
export const metadata: Metadata = {
  title: "Zeva Studio \u00b7 Make it yours",
  description:
    "Customize the Zeva Answer Engine widget — accent color, corners, font, launcher style, and more.",
};

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ bot?: string }>;
}) {
  const { bot } = await searchParams;
  // Opened for a specific bot → this is the signed-in "edit my bot" flow, so
  // show a lightweight back-to-dashboard bar instead of the marketing header
  // (which offers Sign in / Get started and reads wrong when you're logged in).
  const authed = Boolean(bot);

  return (
    <>
      {authed ? (
        <header className="sticky top-0 z-40 flex h-[56px] items-center justify-between border-b border-border bg-glass px-5 backdrop-blur">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-[13.5px] font-[650] text-muted transition-colors hover:text-fg"
          >
            <span aria-hidden>←</span> Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-[700] uppercase tracking-[.16em] text-muted">
              Zeva Studio
            </span>
            <WidgetThemeToggle />
          </div>
        </header>
      ) : (
        <SiteHeader />
      )}
      <Studio botId={bot ?? ""} />
    </>
  );
}
