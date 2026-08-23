"use client";

import { RefreshCw, Code2, Lock } from "lucide-react";
import { motion } from "framer-motion";

const FEATURES_DATA = [
  {
    title: "Real-time Content Sync",
    description: "Connect your Notion, Zendesk, or website. Ochreshift instantly detects changes and updates its vector index within seconds—no manual retrains required.",
    icon: RefreshCw,
    uiElement: (
      <div className="flex flex-col gap-3 font-mono text-[10px] text-muted">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-500">Syncing active</span>
        </div>
        <div className="bg-bg rounded p-2 border border-border flex justify-between items-center">
          <span>docs/api/endpoints.md</span>
          <span className="text-slate-500">updated 2s ago</span>
        </div>
        <div className="bg-bg rounded p-2 border border-border flex justify-between items-center">
          <span>help/billing-faq.md</span>
          <span className="text-slate-500">updated 12m ago</span>
        </div>
      </div>
    )
  },
  {
    title: "Advanced Vector Search",
    description: "Powered by semantic search, the engine understands context and intent, retrieving the exact technical snippet or policy detail instantly.",
    icon: Code2,
    uiElement: (
      <div className="flex flex-col gap-2">
        <div className="bg-bg rounded p-2 text-[10px] font-mono text-slate-500 border border-border">
          <span className="text-[#FFB800]">&gt;</span> query: "reset API key"
        </div>
        <div className="flex gap-1 h-12 items-end pt-2">
          {[40, 70, 95, 60, 30].map((height, i) => (
            <div key={i} className="flex-1 bg-bg rounded-t-sm relative group overflow-hidden border border-b-0 border-border" style={{ height: '100%' }}>
              <div 
                className={`absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-500 ${i === 2 ? 'bg-[#FFB800]' : 'bg-slate-700/50'}`} 
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    title: "Granular Access Control",
    description: "Keep internal docs internal. Configure strict RBAC rules so the AI only cites public docs for customers, and private repos for employees.",
    icon: Lock,
    uiElement: (
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between bg-bg p-2 rounded border border-border">
          <span className="text-muted">Public KB</span>
          <span className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-[10px]">Read-All</span>
        </div>
        <div className="flex items-center justify-between bg-bg p-2 rounded border border-border">
          <span className="text-muted">Internal Wiki</span>
          <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-[10px]">Restricted</span>
        </div>
        <div className="flex items-center justify-between bg-bg p-2 rounded border border-border">
          <span className="text-muted">Slack Data</span>
          <span className="bg-[#FFB800]/20 text-[#FFB800] px-2 py-0.5 rounded text-[10px]">Team Only</span>
        </div>
      </div>
    )
  }
];

export function Features() {
  return (
    <section className="relative bg-bg w-full font-sans overflow-hidden">
      {/* Atmospheric Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#FFB800]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        
        {/* Part 1: Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-20">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-[#FFB800] uppercase tracking-widest mb-3"
          >
            Core Architecture
          </motion.h3>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-fg tracking-tight leading-tight"
          >
            Support infrastructure that knows your business.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted mt-6"
          >
            Built for engineering and product teams who demand reliability. Connect your data sources securely and let the engine do the heavy lifting.
          </motion.p>
        </div>

        {/* Part 2: The Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {FEATURES_DATA.map((feature, idx) => (
            <motion.div 
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx }}
              className="bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#FFB800]/30 shadow-xl shadow-black/40 flex flex-col h-full group"
            >
              {/* Header Row */}
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800] shrink-0 transition-transform duration-300 group-hover:scale-110">
                  <feature.icon size={20} />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-fg mb-3 tracking-tight">{feature.title}</h3>
              
              {/* Description */}
              <p className="text-sm text-muted leading-relaxed mb-10 flex-1">
                {feature.description}
              </p>
              
              {/* Visual Element */}
              <div className="bg-surface rounded-xl p-4 border border-border mt-auto shadow-inner">
                {feature.uiElement}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
