"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const CHECKLIST_ITEMS = [
  "Customizable brand tone",
  "Multi-language support",
  "Context-aware responses"
];

export function PersonaSplit() {
  return (
    <section className="bg-bg w-full font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-24">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Part 1: Left Column (Text & Checklist) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start"
          >
            <span className="text-xs font-semibold text-[#FFB800] uppercase tracking-wider mb-4 block">
              Brand Persona
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-fg mb-6 leading-tight">
              Answers that feel like they came from your team.
            </h2>
            <p className="text-lg text-muted mb-8">
              Maintain your brand's voice and ensure every customer interaction feels authentic and personalized, completely automatically.
            </p>
            
            <div className="flex flex-col gap-4 mb-8">
              {CHECKLIST_ITEMS.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Check className="text-[#FFB800] w-5 h-5 flex-shrink-0" strokeWidth={3} />
                  <span className="text-muted">{item}</span>
                </div>
              ))}
            </div>

            <Link href="#persona-details" className="inline-flex items-center gap-2 text-sm font-semibold text-fg hover:text-[#FFB800] transition-colors group">
              Learn more
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Part 2: Right Column (MacOS Style Mock UI) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full relative"
          >
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative z-10">
              
              {/* Window Header (MacOS style) */}
              <div className="bg-surface px-4 py-3 border-b border-border flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>

              {/* Window Body (Chat Snippet) */}
              <div className="p-6 bg-bg/50 flex flex-col gap-4">
                
                {/* Settings Prompt */}
                <div className="text-center">
                  <span className="text-xs text-slate-500 bg-white/5 inline-block px-3 py-1 rounded-full mx-auto mb-2">
                    System Tone set to: Friendly &amp; Professional
                  </span>
                </div>

                {/* User Message */}
                <div className="self-end bg-panel border border-border text-fg text-sm p-3 rounded-xl rounded-tr-sm max-w-[85%] shadow-sm">
                  I need help setting up my account.
                </div>

                {/* AI Message */}
                <div className="self-start flex gap-3 max-w-[90%]">
                  <div className="w-8 h-8 rounded-full bg-[#FFB800] flex items-center justify-center text-black font-bold text-xs flex-shrink-0 mt-1 shadow-sm">
                    O
                  </div>
                  <div className="bg-transparent border border-border text-muted text-sm p-4 rounded-xl rounded-tl-sm shadow-sm leading-relaxed">
                    Hey there! Welcome aboard. I'd be absolutely thrilled to help you get your account set up today. Let's start with step one...
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
