"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Flame,
  Lock,
  SendHorizontal,
} from "lucide-react";
import Link from "next/link";

const RISE = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
};

function HexGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <polygon points="16,2 3.88,9 3.88,23 16,30 16,22.4 10.8,19.4 10.8,11 16,8" fill="#08111F" />
      <polygon points="16,2 16,8 21.2,11 21.2,19.4 16,22.4 16,30 28.12,23 28.12,9" fill="#08111F" opacity="0.55" />
    </svg>
  );
}

const INDUSTRIES = ["Salons & spas", "Clinics", "Agencies", "Home services"];

export function Hero() {
  return (
    <section className="relative bg-bg w-full pt-24 sm:pt-28 pb-20 overflow-hidden font-sans">
      {/* Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_65%)] pointer-events-none" />
      <div className="grid-veil" aria-hidden />

      <div className="max-w-[1240px] mx-auto px-6 sm:px-9 relative z-10">

        {/* ── Centered copy block ── */}
        <div className="flex flex-col items-center text-center max-w-[840px] mx-auto">

          <motion.div {...RISE} transition={{ duration: 0.5 }} className="badge-pill mb-7">
            <span className="eyebrow-dot" />
            AI lead capture for service businesses
          </motion.div>

          <motion.h1
            {...RISE}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-display font-bold tracking-[-0.04em] leading-[1.04] text-[42px] sm:text-[58px] lg:text-[72px]"
          >
            Turn website visitors into{" "}
            <span className="gradient-text">qualified leads</span>, 24/7.
          </motion.h1>

          <motion.p
            {...RISE}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-6 text-[17px] sm:text-[19px] text-muted max-w-[620px] leading-relaxed text-balance"
          >
            OchreShift answers your customers&apos; questions instantly — with sources —
            captures their contact details, and alerts your team when it&apos;s time to close.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...RISE}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-9 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link
              href="/sign-up"
              className="btn-shine group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent text-[#08111F] font-[650] text-[16px] px-10 h-[54px] rounded-full hover:bg-accent-strong hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_8px_24px_-6px_color-mix(in_srgb,var(--accent)_40%,transparent)]"
            >
              Start free
              <ArrowRight size={17} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border bg-surface text-fg font-[550] text-[16px] px-10 h-[54px] rounded-full hover:border-accent/45 hover:-translate-y-0.5 transition-all"
            >
              Try the live demo
            </Link>
          </motion.div>

          <motion.p
            {...RISE}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="mt-5 text-[13px] text-muted font-[500] flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
          >
            <span>14-day free trial</span>
            <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
            <span>No credit card required</span>
            <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
            <span>Live in minutes</span>
          </motion.p>

          {/* Industry chips — mirrors monday's use-case checkmarks */}
          <motion.ul
            {...RISE}
            transition={{ duration: 0.55, delay: 0.38 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2"
          >
            {INDUSTRIES.map((industry) => (
              <li
                key={industry}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[12.5px] font-[550] text-muted"
              >
                <Check size={12} strokeWidth={3} className="text-accent" />
                {industry}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* ── Big product visual: your website, with OchreShift on it ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="relative max-w-[960px] mx-auto mt-16"
        >

          {/* Floating toast — hot lead */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 2.4 }}
            className="float-b absolute -top-7 -right-2 sm:-right-8 z-20 hidden md:flex items-center gap-3 rounded-xl border border-border bg-surface/95 backdrop-blur pl-4 pr-5 py-3 shadow-card-hover"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500/10 border border-orange-500/25 shrink-0">
              <Flame size={17} className="text-orange-500" />
            </span>
            <span className="flex flex-col leading-tight text-left">
              <span className="text-[13px] font-[700] text-fg">Hot lead captured</span>
              <span className="text-[12px] text-muted mt-0.5">john@example.com · just now</span>
            </span>
          </motion.div>

          {/* Floating chip — verified answer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 1.9 }}
            className="float-c absolute top-1/2 -left-3 sm:-left-9 z-20 hidden md:flex items-center gap-2.5 rounded-xl border border-border bg-surface/95 backdrop-blur px-4 py-3 shadow-card-hover"
          >
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <span className="flex flex-col leading-tight text-left">
              <span className="text-[13px] font-[700] text-fg">Answer verified</span>
              <span className="text-[12px] text-muted mt-0.5">Grounded in Services.pdf</span>
            </span>
          </motion.div>

          {/* Browser window */}
          <div className="relative rounded-2xl border border-border bg-surface shadow-card-hover overflow-hidden">
            {/* Chrome bar */}
            <div className="flex items-center gap-4 px-4 sm:px-5 py-3 border-b border-border bg-panel">
              <div className="flex gap-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full bg-[#FF5F57]/80" />
                <span className="w-3 h-3 rounded-full bg-[#FEBC2E]/80" />
                <span className="w-3 h-3 rounded-full bg-[#28C840]/80" />
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-bg border border-border px-3 py-1.5 mx-auto">
                <Lock size={10} className="text-emerald-500" />
                <span className="font-mono text-[11.5px] text-muted">lumiere-salon.com</span>
              </div>
              <div className="hidden sm:block w-[52px]" aria-hidden />
            </div>

            {/* Website skeleton */}
            <div className="relative px-6 sm:px-10 pt-7 pb-28 min-h-[340px] sm:min-h-[400px]">
              {/* Fake site nav */}
              <div className="flex items-center justify-between mb-9">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-accent/80" />
                  <span className="h-2.5 w-20 rounded-full bg-border" />
                </div>
                <div className="hidden sm:flex items-center gap-5">
                  <span className="h-2 w-12 rounded-full bg-border" />
                  <span className="h-2 w-12 rounded-full bg-border" />
                  <span className="h-2 w-12 rounded-full bg-border" />
                  <span className="h-7 w-20 rounded-full bg-accent/25 border border-accent/35" />
                </div>
              </div>

              {/* Fake site hero */}
              <div className="max-w-[380px]">
                <div className="h-4 w-4/5 rounded-full bg-border mb-3.5" />
                <div className="h-4 w-3/5 rounded-full bg-border mb-6" />
                <div className="space-y-2.5 mb-7">
                  <div className="h-2.5 w-full rounded-full bg-border/60" />
                  <div className="h-2.5 w-5/6 rounded-full bg-border/60" />
                </div>
                <div className="flex gap-3">
                  <span className="h-9 w-28 rounded-full bg-accent/70" />
                  <span className="h-9 w-24 rounded-full border border-border" />
                </div>
              </div>

              {/* Fake site cards */}
              <div className="hidden sm:grid grid-cols-3 gap-4 mt-10">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-panel p-4">
                    <div className="h-14 rounded-lg bg-border/50 mb-3" />
                    <div className="h-2 w-4/5 rounded-full bg-border mb-2" />
                    <div className="h-2 w-3/5 rounded-full bg-border/60" />
                  </div>
                ))}
              </div>

              {/* ── The OchreShift widget, open on this site ── */}
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.05 }}
                className="absolute bottom-4 right-4 sm:right-6 w-[270px] sm:w-[300px] rounded-xl border border-border bg-surface shadow-card-hover overflow-hidden z-10"
              >
                {/* Widget header */}
                <div className="flex items-center gap-2.5 px-3.5 py-3 bg-panel border-b border-border">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent shrink-0">
                    <HexGlyph className="w-4.5 h-4.5" />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[13px] font-[700] text-fg">Lumière Salon</span>
                    <span className="flex items-center gap-1.5 text-[10.5px] text-muted mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> AI assistant · online
                    </span>
                  </span>
                </div>

                {/* Widget messages */}
                <div className="px-3.5 py-4 flex flex-col gap-3 bg-bg/60">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 1.35 }}
                    className="self-end max-w-[85%] rounded-xl rounded-tr-sm bg-panel border border-border px-3.5 py-2.5 text-[12.5px] leading-snug text-fg"
                  >
                    Do you have anything open this Saturday?
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 1.75 }}
                    className="self-start max-w-[88%] rounded-xl rounded-tl-sm border border-accent/20 bg-accent/[0.06] px-3.5 py-2.5 text-[12.5px] leading-snug text-muted"
                  >
                    Yes! Saturday has openings at 10:00 AM and 2:30 PM for a signature cut &amp; style.
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3, delay: 2.15 }}
                    className="self-start inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10.5px] font-[600] text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle2 size={11} />
                    Source: Services.pdf
                  </motion.div>
                </div>

                {/* Widget input */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-surface">
                  <span className="flex-1 rounded-lg border border-border bg-panel px-3 py-2 text-[11.5px] text-faint">
                    Ask anything…
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-[#08111F] shrink-0">
                    <SendHorizontal size={14} />
                  </span>
                </div>

                {/* Watermark */}
                <div className="py-1.5 text-center border-t border-border">
                  <span className="text-[9px] font-mono tracking-wide text-faint">
                    Powered by ochre<span className="text-accent">shift</span>
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
