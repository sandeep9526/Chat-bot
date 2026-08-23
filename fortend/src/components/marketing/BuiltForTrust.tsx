"use client";

import { motion } from "framer-motion";
import { ShieldCheck, User, Bot, AlertTriangle, ArrowRight, ArrowDownRight, Hash } from "lucide-react";

export function BuiltForTrust() {
  return (
    <section className="relative bg-bg w-full font-sans py-24 overflow-hidden border-t border-border">
      {/* Atmospheric Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#FFB800]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column (Copy) */}
          <div className="flex flex-col items-start">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#FFB800] uppercase tracking-widest mb-4"
            >
              <ShieldCheck size={16} />
              Safety Mechanism
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-fg mb-6 tracking-tight leading-tight"
            >
              AI that knows when to stay grounded.
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted mb-8 leading-relaxed"
            >
              We don't let AI guess. If a user asks an ambiguous question or the system confidence drops below 95%, Ochreshift instantly pauses and routes the ticket directly to your human support team.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-6"
            >
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-[#FFB800] shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-fg font-semibold mb-1">Threshold Monitoring</h3>
                  <p className="text-sm text-muted">Continuous confidence scoring on every query.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-[#FFB800] shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-fg font-semibold mb-1">Seamless Handoff</h3>
                  <p className="text-sm text-muted">Routes to Zendesk, Intercom, or Slack instantly.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column (Visual Node Map) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full relative bg-surface/80 backdrop-blur-sm border border-border rounded-3xl p-8 shadow-2xl"
          >
            {/* The Node Map */}
            <div className="flex flex-col items-center gap-6 relative">
              
              {/* Node 1: User Query */}
              <div className="bg-panel border border-border rounded-xl p-4 w-full max-w-[280px] shadow-lg relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <User size={14} className="text-muted" />
                  <span className="text-xs text-slate-500 font-mono">Incoming Query</span>
                </div>
                <div className="text-sm text-fg">
                  "Can I get a custom enterprise contract with net-90 terms?"
                </div>
              </div>

              {/* Arrow Down */}
              <div className="h-8 w-px bg-gradient-to-b from-white/20 to-white/5" />

              {/* Node 2: Evaluation */}
              <div className="bg-surface border border-yellow-500/30 rounded-xl p-4 w-full max-w-[280px] shadow-[0_0_20px_rgba(255,184,0,0.1)] relative z-10 flex flex-col items-center text-center">
                <AlertTriangle size={20} className="text-[#FFB800] mb-2 animate-pulse" />
                <span className="text-xs text-[#FFB800] font-mono mb-1">Confidence Score: 62%</span>
                <span className="text-[10px] text-muted uppercase tracking-wider">Below Threshold (95%)</span>
              </div>

              {/* Split Arrows */}
              <div className="relative w-full max-w-[280px] h-12 flex justify-between">
                {/* Auto Response Route (Faded out) */}
                <div className="absolute left-[20%] top-0 h-full w-px bg-white/5" />
                <ArrowDownRight size={16} className="absolute left-[20%] bottom-0 -translate-x-1/2 translate-y-1/2 text-fg/5" />
                
                {/* Handoff Route (Active) */}
                <div className="absolute right-[20%] top-0 h-full w-px bg-gradient-to-b from-[#FFB800]/50 to-green-500/50" />
                <ArrowDownRight size={16} className="absolute right-[20%] bottom-0 -translate-x-1/2 translate-y-1/2 text-green-500" />
              </div>

              {/* Final Nodes */}
              <div className="flex justify-between w-full max-w-[340px] gap-4 relative z-10">
                {/* Rejected Path */}
                <div className="flex-1 bg-surface border border-border rounded-xl p-3 opacity-30 grayscale flex flex-col items-center">
                  <Bot size={16} className="mb-2" />
                  <span className="text-[10px] text-center">AI Response</span>
                  <span className="text-[9px] text-red-400 mt-1">Blocked</span>
                </div>

                {/* Active Path */}
                <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex flex-col items-center shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                  <Hash size={16} className="text-green-500 mb-2" />
                  <span className="text-[10px] text-green-500 text-center font-medium">Human Handoff</span>
                  <span className="text-[9px] text-green-500/70 mt-1">Routed to #sales-enterprise</span>
                </div>
              </div>

            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
