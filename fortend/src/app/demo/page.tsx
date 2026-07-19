"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useZevaStore } from "@/stores/zevaStore";
import { useAutoBrand } from "@/hooks/useAutoBrand";
import { DemoSite } from "@/components/studio/DemoSite";
import { ZevaWidget } from "@/components/widget/ZevaWidget";
import { BOT_ID } from "@/lib/defaults";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { Footer } from "@/components/marketing/Footer";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { ArrowRightIcon, CheckIcon } from "@/components/marketing/icons";

/**
 * Public "watch it work" demo — distinct from /studio, which is a
 * customization tool. This page is deliberately real, not mocked: it calls
 * useAutoBrand(BOT_ID) to pull the live acme-salon bot's branding from the
 * real backend (/config), and the widget's chat/lead calls go through the
 * same real /chat and /lead endpoints a real client's site would use.
 */
export default function DemoPage() {
  useAutoBrand(BOT_ID);
  const setOpen = useZevaStore((s) => s.setOpen);

  // Open immediately — a demo's whole point is to be seen working with zero
  // clicks, not discovered behind a launcher bubble.
  useEffect(() => {
    setOpen(true);
  }, [setOpen]);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-[1100px] px-6 py-12 sm:px-9 sm:py-16">
        <div className="max-w-[640px]">
          <Eyebrow>Live demo</Eyebrow>
          <h1 className="mt-3 font-display text-[clamp(28px,4.4vw,42px)] font-[800] leading-[1.08] tracking-[-.03em] text-fg">
            A real bot, answering from real documents.
          </h1>
          <p className="mt-4 text-[16px] leading-[1.6] text-muted">
            This is Acme Salon&apos;s actual assistant, backed by the real Zeva
            API — not a script. Ask it something in-scope (try{" "}
            <span className="font-[600] text-fg">
              &ldquo;how much is a haircut?&rdquo;
            </span>
            ) and something off-topic (try{" "}
            <span className="font-[600] text-fg">
              &ldquo;what&apos;s the capital of France?&rdquo;
            </span>
            ) and watch it refuse to guess.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            {["Real retrieval, real sources", "No script, no canned answers", "Yours will answer from your docs"].map(
              (r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-2 text-[13.5px] font-[600] text-muted"
                >
                  <CheckIcon className="h-4 w-4 text-good" />
                  {r}
                </span>
              ),
            )}
          </div>
        </div>

        {/* Browser frame holding the real DemoSite + working widget */}
        <div className="relative mt-10 min-h-[620px] overflow-hidden rounded-r3 border border-border bg-surface shadow-panel">
          <div className="flex items-center gap-2 border-b border-border bg-panel px-4 py-3">
            <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
            <span className="ml-2.5 flex items-center gap-1.5 truncate rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-faint">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              acmesalon.com
            </span>
          </div>

          <DemoSite />
          <ZevaWidget />
        </div>

        {/* Closing CTA */}
        <div className="card mt-8 flex flex-wrap items-center justify-between gap-4 border-accent-ring p-7">
          <p className="m-0 max-w-[52ch] text-[15px] text-muted">
            Want this for your own business? Bring your own documents, brand it,
            and get an embed code in minutes.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex shrink-0 items-center gap-2 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-6 py-3 text-[14.5px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5"
          >
            Get started free
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
