"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowRight, CheckCircle2, User, Flame } from "lucide-react";
import Link from "next/link";

function ProductConversationDemo() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-8 shadow-2xl relative w-full max-w-2xl mx-auto overflow-hidden">
      {/* Subtle top glare */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[13px] font-[600] text-muted uppercase tracking-widest">Active Conversation</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Visitor Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-panel flex items-center justify-center shrink-0 mt-1">
            <User size={18} className="text-muted" />
          </div>
          <div className="bg-panel border border-border text-fg text-[16px] px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm">
            Do you offer emergency appointments?
          </div>
        </motion.div>

        {/* OchreShift Response */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          className="flex gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-[#FFB800] flex items-center justify-center shrink-0 mt-1 shadow-[0_0_15px_rgba(255,184,0,0.3)]">
            <span className="text-black font-bold text-[14px]">O</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-transparent border border-border text-muted text-[16px] px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm leading-relaxed">
              Yes. Emergency appointments are available 24/7. Our on-call team can typically dispatch someone within 60 minutes.
            </div>

            {/* Source Citation */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3, delay: 2.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 mt-1 rounded-md"
            >
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-[13.5px] font-[500] text-muted">
                Source: Services.pdf
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Buying Intent / Lead Capture */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 3.8 }}
          className="flex gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center shrink-0 mt-1" />
          <div className="flex flex-col gap-3">
            <div className="bg-transparent border border-border text-muted text-[16px] px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm leading-relaxed">
              Would you like someone from our team to help you get started?
            </div>
          </div>
        </motion.div>

        {/* Hot Lead Alert */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 5.5 }}
          className="mt-3 ml-12 sm:ml-[56px] mb-4 border border-orange-500/30 bg-orange-500/10 rounded-lg p-3 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-4 relative overflow-hidden"
        >
          <Flame size={20} className="text-orange-500" />
          <div className="flex flex-col">
            <span className="text-[13px] font-[700] text-orange-500 uppercase tracking-widest mb-0.5">Hot Lead</span>
            <span className="text-[13px] text-muted">Team alerted for human takeover</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative bg-bg w-full pt-32 pb-28 overflow-hidden font-sans">
      {/* Atmospheric Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,184,0,0.15),rgba(11,15,25,0))] pointer-events-none" />

      <div className="max-w-[1240px] mx-auto px-6 sm:px-9 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Left Column: Text & CTAs */}
          <div className="flex flex-col items-start lg:col-span-6 xl:pr-8">

            {/* Optional Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-border text-[12px] font-[700] uppercase tracking-widest text-muted mb-8 backdrop-blur-sm"
            >
              <span className="w-2 h-2 bg-[#FFB800] rounded-full shadow-[0_0_8px_rgba(255,184,0,0.6)]" />
              AI lead capture for service businesses
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[42px] sm:text-[52px] md:text-[64px] lg:text-[76px] font-bold text-fg tracking-tight leading-[1.05] mb-6 text-balance max-w-3xl"
            >
              Turn website visitors into qualified leads 24/7.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-[17px] sm:text-[18px] md:text-[20px] text-muted mb-10 max-w-xl leading-relaxed text-balance"
            >
              OchreShift answers customer questions from your business knowledge, detects buying intent, captures qualified leads, and alerts your team when it's time to close.
            </motion.p>

            {/* Action Cluster */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-start gap-4 w-full sm:w-auto"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link
                  href="/sign-up"
                  className="w-full sm:w-auto bg-[#FFB800] text-black font-[600] px-8 py-4 text-[16px] rounded-md hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
                >
                  Start free
                </Link>
                <Link
                  href="/demo"
                  className="w-full sm:w-auto text-fg border border-border bg-white/[0.03] px-8 py-4 text-[16px] font-[500] rounded-md hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-2"
                >
                  Try the live demo
                  <ArrowRight size={16} className="text-muted" />
                </Link>
              </div>
              <span className="text-[13px] text-slate-500 font-[500] ml-1">14-day free trial</span>
            </motion.div>
          </div>

          {/* Right Column: Product Demo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6 w-full relative"
          >
            <ProductConversationDemo />
          </motion.div>

        </div>
      </div>
    </section>
  );
}

