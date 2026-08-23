"use client";

import { motion } from "framer-motion";
import { Database, Binary, SlidersHorizontal, Rocket } from "lucide-react";

export function Process() {
  const steps = [
    {
      icon: Database,
      title: "1. Ingest Docs",
      description: "Connect your existing Zendesk, Notion, or raw markdown files securely.",
      uiElement: (
        <div className="flex flex-col gap-2 p-2 justify-center h-full text-[10px] font-mono text-muted">
          <div className="flex items-center gap-2">
            <span className="text-green-500">GET</span> <span>/api/v1/sync</span>
          </div>
          <div className="h-1.5 w-full bg-bg border border-border rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-green-500/50 rounded-full animate-pulse" />
          </div>
          <div className="flex justify-between">
            <span>Transferring...</span>
            <span>42.1 MB</span>
          </div>
        </div>
      )
    },
    {
      icon: Binary,
      title: "2. Vectorize & Index",
      description: "Data is chunked and embedded into high-dimensional vector space.",
      uiElement: (
        <div className="flex flex-col justify-center h-full p-2 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-16 h-16 rounded-full border border-dashed border-[#FFB800] animate-[spin_10s_linear_infinite]" />
          </div>
          <div className="flex flex-wrap gap-1 z-10 justify-center">
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-sm ${i % 3 === 0 ? 'bg-[#FFB800]' : 'bg-slate-700'}`} />
            ))}
          </div>
          <div className="text-center text-[9px] text-[#FFB800] mt-2 font-mono uppercase tracking-widest z-10">
            Embedding space
          </div>
        </div>
      )
    },
    {
      icon: SlidersHorizontal,
      title: "3. Train Tone",
      description: "Fine-tune the response behavior to match your exact brand guidelines.",
      uiElement: (
        <div className="flex flex-col justify-center h-full gap-2 p-2 text-[10px] font-medium text-muted">
          <div className="flex justify-between items-center bg-bg rounded p-1.5 border border-border">
            <span>Professional</span>
            <div className="w-6 h-3 bg-green-500/20 rounded-full relative">
              <div className="absolute right-0.5 top-0.5 w-2 h-2 bg-green-500 rounded-full" />
            </div>
          </div>
          <div className="flex justify-between items-center bg-bg rounded p-1.5 border border-border">
            <span>Emojis</span>
            <div className="w-6 h-3 bg-slate-700 rounded-full relative">
              <div className="absolute left-0.5 top-0.5 w-2 h-2 bg-slate-500 rounded-full" />
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Rocket,
      title: "4. Deploy Agent",
      description: "Go live via API, Slack, or embed directly onto your website.",
      uiElement: (
        <div className="flex flex-col gap-2 p-2 justify-center h-full">
          <div className="self-start bg-bg border border-border h-6 w-3/4 rounded-lg rounded-tl-sm" />
          <div className="self-end bg-[#FFB800]/20 border border-[#FFB800]/20 text-[#FFB800] h-6 w-2/3 rounded-lg rounded-tr-sm flex items-center px-2">
             <div className="w-1.5 h-1.5 bg-[#FFB800] rounded-full animate-pulse mr-1" />
             <div className="h-1 w-1/2 bg-[#FFB800]/50 rounded-full" />
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="bg-bg w-full font-sans relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        
        {/* Part 1: Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-20">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-[#FFB800] uppercase tracking-widest mb-3"
          >
            How it works
          </motion.h3>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-fg mb-6 tracking-tight leading-tight"
          >
            From raw data to resolved tickets.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted"
          >
            Get set up in minutes. We handle all the complexity of vector embeddings, chunking, and model routing.
          </motion.p>
        </div>

        {/* Part 2: The 4-Step Timeline Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          {/* The Connecting Line (Desktop Only) */}
          <div className="hidden md:block absolute top-5 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-[#FFB800]/30 to-transparent z-0" />

          {/* Part 3: The Step Items */}
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx }}
              className="flex flex-col relative z-10"
            >
              {/* Step Icon */}
              <div className="w-10 h-10 rounded-full bg-surface border border-[#FFB800]/30 shadow-[0_0_15px_rgba(255,184,0,0.15)] flex items-center justify-center text-[#FFB800] mb-6 shrink-0 z-10 relative">
                <step.icon size={18} />
              </div>
              
              {/* Step Title */}
              <h3 className="text-xl font-bold text-fg mb-3 tracking-tight">
                {step.title}
              </h3>
              
              {/* Step Description */}
              <p className="text-sm text-muted mb-8 min-h-[60px] leading-relaxed">
                {step.description}
              </p>
              
              {/* Mini UI Card */}
              <div className="bg-surface/80 backdrop-blur-sm border border-border rounded-xl p-4 h-32 relative overflow-hidden group transition-all duration-300 hover:border-[#FFB800]/30 shadow-xl shadow-black/40 mt-auto">
                {step.uiElement}
              </div>
            </motion.div>
          ))}

        </div>
      </div>
    </section>
  );
}
