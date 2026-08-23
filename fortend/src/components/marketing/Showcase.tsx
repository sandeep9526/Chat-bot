"use client";

import { motion } from "framer-motion";
import { MessageSquare, Sparkles, Send, FileText, CheckCircle2, ShieldCheck, Filter, Search } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  { q: "How do I handle refunds?", category: "Billing", active: false },
  { q: "What are your API rate limits?", category: "Technical", active: true },
  { q: "Can I integrate with Slack?", category: "Integrations", active: false },
  { q: "Where can I find the API docs?", category: "Technical", active: false },
  { q: "SSO configuration steps?", category: "Security", active: false }
];

export function Showcase() {
  return (
    <section className="relative bg-bg w-full font-sans overflow-hidden">
      {/* Atmospheric Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-[#FFB800]/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-24 relative z-10">
        
        {/* Part 1: Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-20">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-[#FFB800] uppercase tracking-widest mb-3"
          >
            Ticket Deflection Dashboard
          </motion.h3>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-fg mb-6 tracking-tight leading-tight"
          >
            Watch it resolve issues instantly.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted"
          >
            See exactly how Ochreshift filters through your documentation to synthesize precise, zero-hallucination answers.
          </motion.p>
        </div>

        {/* Part 2: The Large Mock Dashboard */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="bg-surface/90 backdrop-blur-md border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
        >
          {/* Part 3: Dashboard Left Panel (Filterable Query List) */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border p-6 bg-bg/50 flex flex-col">
            
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-semibold text-fg tracking-wide">
                Incoming Queries
              </h4>
              <button className="text-muted hover:text-fg transition-colors">
                <Filter size={16} />
              </button>
            </div>
            
            <div className="relative mb-6">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search queries..."
                className="w-full bg-panel border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-muted outline-none placeholder:text-slate-500 focus:border-[#FFB800]/50 transition-colors"
                readOnly
              />
            </div>

            <div className="flex flex-col flex-1 gap-2">
              {SUGGESTED_QUESTIONS.map((item, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-all border ${
                    item.active 
                    ? 'bg-[#FFB800]/5 border-[#FFB800]/20' 
                    : 'bg-surface border-transparent hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${
                      item.category === 'Technical' ? 'bg-blue-500/20 text-blue-400' :
                      item.category === 'Billing' ? 'bg-green-500/20 text-green-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-500">2m ago</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare size={16} className={`mt-0.5 shrink-0 ${item.active ? 'text-[#FFB800]' : 'text-slate-500'}`} />
                    <span className={`text-sm font-medium ${item.active ? 'text-fg' : 'text-muted'}`}>
                      {item.q}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Part 4: Dashboard Right Panel (Live Simulation) */}
          <div className="w-full md:w-2/3 flex flex-col relative bg-surface">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-bg/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-[#FFB800]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-fg font-semibold">Resolution Sandbox</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-muted">Zero-Hallucination Mode: Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-8 space-y-8 overflow-y-auto">
              
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-panel border border-border text-fg text-[15px] p-5 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
                  What are your API rate limits? We are planning to run heavy batch processing.
                </div>
              </div>

              {/* Engine Logs (Simulation Step) */}
              <div className="flex flex-col gap-2 ml-14">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span>Intent parsed: Technical API limitations</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <FileText size={14} className="text-blue-500" />
                  <span>Scanning index: /api-docs/rate-limits.md</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span>Fact-check complete. Confidence: 99.8%</span>
                </div>
              </div>

              {/* AI Message */}
              <div className="flex justify-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FFB800] text-black flex items-center justify-center shrink-0 mt-1 shadow-[0_0_15px_rgba(255,184,0,0.3)]">
                  <span className="font-bold text-sm">O</span>
                </div>
                <div className="bg-surface border border-border text-muted text-[15px] p-6 rounded-2xl rounded-tl-sm max-w-[90%] shadow-lg">
                  <p className="mb-4 leading-relaxed">
                    Our standard API rate limit is <strong>1,000 requests per minute</strong> per organization. If you exceed this limit, you will receive a <code>429 Too Many Requests</code> response.
                  </p>
                  <p className="mb-4 leading-relaxed">
                    For heavy batch processing, we recommend using our bulk endpoint which allows processing up to 10,000 items in a single request.
                  </p>
                  
                  {/* Embedded Citation Card */}
                  <div className="mt-6 p-4 bg-bg border border-border rounded-xl">
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">Source Material</div>
                    <div className="flex items-center gap-2 text-[#FFB800] text-sm">
                      <FileText size={16} />
                      <span className="font-mono">docs.ochreshift.com/api-limits</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Chat Input Area */}
            <div className="p-6 border-t border-border bg-bg/50 mt-auto">
              <div className="flex items-center gap-3 bg-panel border border-border rounded-xl p-2.5">
                <input 
                  type="text" 
                  placeholder="Simulate a query..." 
                  className="bg-transparent border-none outline-none text-muted text-sm flex-1 px-3 pointer-events-none"
                  readOnly
                />
                <button className="bg-[#FFB800] hover:bg-yellow-400 text-black p-3 rounded-lg transition-colors shrink-0 shadow-md">
                  <Send size={18} />
                </button>
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
