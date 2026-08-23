"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Play, Globe, FileText, HelpCircle, Book, CheckCircle, MessageSquare, Target, Clock, Star, Hexagon } from "lucide-react";

export function LightModeFlowchart() {
  return (
    <section className="bg-white w-full font-sans">
      <div className="max-w-7xl mx-auto px-6 py-24 text-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Part 1: Left Column (Copy & CTAs) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-xs font-bold text-[#FFB800] bg-yellow-500/10 px-3 py-1 rounded-full inline-block uppercase tracking-wider mb-6">
              BUILT FOR BUSINESSES
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
              AI that works from your content
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-lg">
              Upload your content, customize your bot, and let ochreshift handle the rest. More answers. Happier customers. More leads. Less busywork.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <button className="bg-[#FFB800] text-black font-semibold px-6 py-3 rounded-md flex items-center gap-2 hover:bg-yellow-500 transition-colors">
                Start free <ArrowUpRight size={18} />
              </button>
              <button className="flex items-center gap-2 text-slate-900 font-semibold px-6 py-3 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                See how it works <Play size={16} fill="currentColor" className="text-slate-900" />
              </button>
            </div>

            <div className="flex items-center gap-4 pt-8 border-t border-slate-100">
              <div className="flex flex-col gap-1">
                <div className="flex text-[#FFB800]">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <span className="text-sm font-medium text-slate-600">4.9/5 from 200+ reviews</span>
              </div>
              <div className="flex -space-x-2 ml-4">
                <div className="w-8 h-8 rounded-full border-2 border-border bg-slate-200" />
                <div className="w-8 h-8 rounded-full border-2 border-border bg-slate-300" />
                <div className="w-8 h-8 rounded-full border-2 border-border bg-slate-400" />
              </div>
            </div>
          </motion.div>

          {/* Part 2: Right Column (The Hexagon Branching UI) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-[400px] flex items-center justify-center mx-auto"
          >
            {/* Horizontal Connecting Lines */}
            <div className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden sm:flex flex-col justify-center items-center gap-[62px] px-24">
               <div className="w-full border-t border-dashed border-slate-200" />
               <div className="w-full border-t border-dashed border-slate-200" />
               <div className="w-full border-t border-dashed border-slate-200" />
               <div className="w-full border-t border-dashed border-slate-200" />
            </div>

            {/* Central Node (Logo) */}
            <div className="w-24 h-24 bg-surface flex items-center justify-center relative z-20 shadow-2xl rounded-xl">
              <Hexagon size={48} className="text-[#FFB800]" strokeWidth={1.5} />
            </div>

            {/* Left Input Nodes */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col justify-between h-[250px] w-[180px] z-10">
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 shadow-sm text-sm font-medium w-full">
                <Globe size={18} className="text-muted shrink-0" />
                <span className="truncate">Website</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 shadow-sm text-sm font-medium w-full">
                <FileText size={18} className="text-muted shrink-0" />
                <span className="truncate">PDFs & Docs</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 shadow-sm text-sm font-medium w-full">
                <HelpCircle size={18} className="text-muted shrink-0" />
                <span className="truncate">FAQs</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 shadow-sm text-sm font-medium w-full">
                <Book size={18} className="text-muted shrink-0" />
                <span className="truncate">Notion / Confluence</span>
              </div>
            </div>

            {/* Right Output Nodes */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col justify-between h-[250px] w-[200px] z-10">
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 shadow-sm text-sm font-medium w-full">
                <MessageSquare size={18} className="text-[#FFB800] shrink-0" />
                <span className="truncate text-xs">Answers from your content</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 shadow-sm text-sm font-medium w-full">
                <CheckCircle size={18} className="text-[#FFB800] shrink-0" />
                <span className="truncate">Shows sources</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 shadow-sm text-sm font-medium w-full">
                <Target size={18} className="text-[#FFB800] shrink-0" />
                <span className="truncate">Captures leads</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 shadow-sm text-sm font-medium w-full">
                <Clock size={18} className="text-[#FFB800] shrink-0" />
                <span className="truncate">Works 24/7</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
