import type { ReactNode } from "react";
import Link from "next/link";
import { CheckIcon, ShieldMarkIcon } from "@/components/marketing/icons";

const POINTS = [
  "Answers only from your content, with sources",
  "Captures leads 24/7 — even at 2am",
  "One script tag, any site — fully managed",
];

/**
 * Split-screen auth layout: an on-brand value panel (left, desktop only) beside
 * the form (right). Reinforces the pitch at the moment of sign-up and keeps
 * sign-in / sign-up perfectly consistent.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-accent to-accent-strong p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(70% 60% at 80% 0%, rgba(255,255,255,0.16), transparent 70%)",
          }}
        />
        <Link href="/" className="relative flex w-fit items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-r1 bg-white/15">
            <ShieldMarkIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="text-[17px] font-[750] tracking-[-.01em]">Zeva</span>
        </Link>

        <div className="relative">
          <h2 className="max-w-[16ch] font-display text-[clamp(26px,3vw,36px)] font-[800] leading-[1.1] tracking-[-.02em]">
            Answers from your content. Leads while you sleep.
          </h2>
          <ul className="mt-7 flex flex-col gap-3.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-[14.5px] text-white/90">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-[12px] text-white/70">
          A chatbot that only answers from your content.
        </p>
      </div>

      {/* Form area */}
      <div className="flex items-center justify-center bg-bg px-5 py-12">
        <div className="w-full max-w-[400px]">
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2.5 lg:hidden"
          >
            <span className="grid h-8 w-8 place-items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong text-white">
              <ShieldMarkIcon className="h-[17px] w-[17px]" />
            </span>
            <span className="text-[16px] font-[750] text-fg">Zeva</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
