"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Flame,
  Lock,
  SendHorizontal,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
    <section className="relative w-full pt-24 sm:pt-32 pb-20 overflow-hidden font-sans bg-gradient-to-b from-bg to-bg-2 dark:bg-none dark:bg-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_65%)] pointer-events-none" />
      <div className="grid-veil" aria-hidden />

      <div className="max-w-[1240px] mx-auto px-6 sm:px-9 relative z-10 flex flex-col items-center">

        {/* ── Centered copy block ── */}
        <div className="flex flex-col items-center text-center max-w-[860px] mx-auto">
          <motion.div {...RISE} transition={{ duration: 0.5 }} className="badge-pill mb-7">
            <span className="eyebrow-dot" />
            AI lead capture for service businesses
          </motion.div>

          <motion.h1
            {...RISE}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-display font-bold tracking-[-0.04em] leading-[1.04] text-[46px] sm:text-[64px] lg:text-[76px]"
          >
            Your website should <br className="hidden sm:block" />
            never <span className="gradient-text">miss a lead</span>.
          </motion.h1>

          <motion.p
            {...RISE}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-6 text-[18px] sm:text-[20px] text-muted max-w-[680px] leading-relaxed text-balance"
          >
            OchreShift talks to visitors, answers their questions, and captures qualified leads for your service business 24/7.
          </motion.p>

          <motion.div
            {...RISE}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <Link
              href="/sign-up"
              className="btn-shine group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent text-[#08111F] font-[650] text-[16px] px-10 h-[54px] rounded-full hover:bg-accent-strong hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_8px_24px_-6px_color-mix(in_srgb,var(--accent)_40%,transparent)]"
            >
              Start My Free Trial
              <ArrowRight size={17} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            {...RISE}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="mt-10 flex items-center justify-center gap-1.5"
          >
            <div className="flex items-center gap-0.5 text-[#F59E0B] mr-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={15} className="fill-current text-[#F59E0B]" />
              ))}
            </div>
            <span className="text-[14px] font-[600] text-fg">4.9/5</span>
            <span className="text-[14px] text-muted mx-1">·</span>
            <span className="text-[14px] font-[500] text-muted">Trusted by 500+ service businesses</span>
          </motion.div>
        </div>

        {/* ── Realistic Widget Visual ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative w-full max-w-[900px] mt-20 mx-auto"
        >
          {/* Ambient Glow Behind Widget */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] bg-accent/20 dark:bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Subtle Background Browser Skeleton */}
          <div className="absolute inset-x-0 bottom-0 h-[400px] sm:h-[450px] bg-panel/70 dark:bg-panel/30 border border-border/80 dark:border-border/40 rounded-t-2xl shadow-2xl overflow-hidden backdrop-blur-md pointer-events-none opacity-90 hidden md:block">
            {/* Browser Header */}
            <div className="h-10 bg-bg/50 border-b border-border/40 flex items-center px-4 gap-2">
              <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/50" /><span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/50" /><span className="w-2.5 h-2.5 rounded-full bg-[#28C840]/50" /></div>
            </div>
            {/* Fake Content */}
            <div className="p-8 space-y-4">
              <div className="h-6 bg-border/30 rounded w-1/3"></div>
              <div className="h-4 bg-border/20 rounded w-3/4 mt-4"></div>
              <div className="h-4 bg-border/20 rounded w-5/6"></div>
              <div className="h-4 bg-border/20 rounded w-1/2"></div>
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="h-24 bg-border/20 rounded-xl"></div>
                <div className="h-24 bg-border/20 rounded-xl"></div>
                <div className="h-24 bg-border/20 rounded-xl"></div>
              </div>
            </div>
          </div>

          {/* Authentic OchreShift Widget */}
          <div className="relative z-10 mx-auto w-full max-w-[360px] sm:max-w-[380px] bg-surface border border-border shadow-[0_24px_64px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.6)] rounded-[20px] overflow-visible flex flex-col h-[520px] sm:h-[560px] md:ml-auto md:mr-16 mb-[-40px]">

            {/* Widget Header */}
            <div className="flex items-center gap-3 px-4 py-4 bg-panel border-b border-border rounded-t-[20px]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent shrink-0">
                <HexGlyph className="w-5 h-5 text-[#08111F]" />
              </span>
              <div className="flex flex-col">
                <span className="text-[14px] font-[700] text-fg leading-tight">Lumière Salon</span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5 font-[500]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> AI assistant online
                </span>
              </div>
            </div>

            {/* Chat Flow */}
            <div className="flex-1 flex flex-col gap-4 px-4 py-5 bg-bg/70 overflow-hidden relative">

              {/* Message 1: AI initial */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="self-start max-w-[85%]"
              >
                <div className="flex items-end gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent shrink-0 border border-border/50">
                    <HexGlyph className="w-3 h-3 text-[#08111F]" />
                  </span>
                  <div className="bg-panel border border-border/80 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] leading-[1.4] text-fg shadow-sm">
                    Hi! How can we help?
                  </div>
                </div>
              </motion.div>

              {/* Message 2: Visitor question */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.4 }}
                className="self-end max-w-[85%] flex flex-col items-end"
              >
                <div className="bg-accent text-[#08111F] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-[13px] leading-[1.4] font-[500] shadow-sm">
                  Do you offer emergency plumbing tonight?
                </div>
              </motion.div>

              {/* Message 3: AI Answer */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 2.1 }}
                className="self-start max-w-[90%]"
              >
                <div className="flex items-end gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent shrink-0 border border-border/50">
                    <HexGlyph className="w-3 h-3 text-[#08111F]" />
                  </span>
                  <div className="bg-panel border border-border/80 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] leading-[1.4] text-fg shadow-sm">
                    Yes. Our team is available 24/7 for emergency plumbing. Would you like me to get you a quote?
                  </div>
                </div>
              </motion.div>

              {/* Message 4: Visitor Yes */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 2.8 }}
                className="self-end max-w-[85%]"
              >
                <div className="bg-accent text-[#08111F] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-[13px] leading-[1.4] font-[500] shadow-sm">
                  Yes, please.
                </div>
              </motion.div>

              {/* Message 5: AI asks number */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 3.5 }}
                className="self-start max-w-[90%]"
              >
                <div className="flex items-end gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent shrink-0 border border-border/50">
                    <HexGlyph className="w-3 h-3 text-[#08111F]" />
                  </span>
                  <div className="bg-panel border border-border/80 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] leading-[1.4] text-fg shadow-sm">
                    Great. What's the best number to reach you?
                  </div>
                </div>
              </motion.div>

              {/* Message 6: Visitor gives number */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 4.2 }}
                className="self-end max-w-[85%]"
              >
                <div className="bg-accent text-[#08111F] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-[13px] font-mono font-[600] tracking-wide shadow-sm">
                  +1 (555) 284-0192
                </div>
              </motion.div>

              {/* Message 7: System confirms */}
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                transition={{ duration: 0.4, delay: 4.8 }}
                className="self-end"
              >
                <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-[600] text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                  Lead captured
                </div>
              </motion.div>
            </div>

            {/* Input area */}
            <div className="px-4 py-3 border-t border-border bg-surface rounded-b-[20px] flex items-center gap-2">
              <div className="flex-1 bg-panel border border-border/60 rounded-[10px] h-[38px] px-3 flex items-center text-[12px] text-muted font-[500]">
                Ask anything...
              </div>
              <span className="grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-accent text-[#08111F] shrink-0 hover:bg-accent-strong transition-colors cursor-pointer">
                <SendHorizontal size={16} strokeWidth={2.5} />
              </span>
            </div>

            {/* Float-out Notification */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 5.4 }}
              className="absolute bottom-16 left-4 sm:left-auto sm:-left-[180px] z-30 flex items-center gap-3.5 rounded-2xl border border-border bg-surface/95 backdrop-blur-xl px-4 py-3.5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500/10 border border-orange-500/20 shrink-0">
                <Flame size={20} className="text-orange-500" />
              </span>
              <div className="flex flex-col leading-tight whitespace-nowrap">
                <span className="text-[13px] font-[700] text-fg mb-0.5 flex items-center gap-1.5">
                  New qualified lead <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[12px] text-muted">
                  John · Emergency service
                </span>
              </div>
            </motion.div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
