"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowRightIcon, SourceCheckIcon } from "./icons";
import { Globe, BookOpen, Database, Lock } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTypewriter } from "./useAnimations";

const AI_RESPONSE = "Yes, you can book an appointment online through our booking page. We offer same-day availability for most services.";

export function AIChatPreview() {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start center"]
  });

  const backgroundColor = useTransform(scrollYProgress, [0, 1], ["#ffffff", "#08111F"]);

  const { scrollYProgress: typeProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "center center"]
  });

  const isActive = typeProgress.get() > 0.2;
  const typedText = useTypewriter(AI_RESPONSE, isActive, 25, 600);
  const showSources = typedText.length >= AI_RESPONSE.length;

  return (
    <motion.section 
      ref={sectionRef} 
      style={{ backgroundColor }}
      className="section-normal overflow-hidden relative min-h-[900px] flex items-center"
    >
      <div className="marketing-container relative z-10 w-full">
        
        {/* Massive background text that fades in */}
        <motion.div 
          style={{ opacity: useTransform(scrollYProgress, [0.5, 1], [0, 0.03]) }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[20vw] font-bold text-fg whitespace-nowrap pointer-events-none"
        >
          INTELLIGENCE
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left side: Complex UI Visualization */}
          <div className="relative aspect-square w-full max-w-[500px] mx-auto hidden md:block">
            {/* SVG Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.path 
                d="M 20 30 C 40 30, 40 50, 60 50" 
                fill="none" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="0.5"
                strokeDasharray="1 1"
              />
              <motion.path 
                d="M 20 30 C 40 30, 40 50, 60 50" 
                fill="none" 
                stroke="#F5A900" 
                strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
              />

              <motion.path 
                d="M 20 70 C 40 70, 40 50, 60 50" 
                fill="none" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="0.5"
                strokeDasharray="1 1"
              />
              <motion.path 
                d="M 20 70 C 40 70, 40 50, 60 50" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.4 }}
              />
            </svg>

            {/* Data Source Nodes */}
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="absolute top-[25%] left-0 -translate-y-1/2 bg-[#101B30] border border-border rounded-xl p-3 md:p-4 flex items-center gap-3 shadow-xl z-10 w-[140px] md:w-[160px]"
            >
              <div className="h-8 w-8 md:h-10 md:w-10 rounded bg-[#F5A900]/10 flex items-center justify-center shrink-0">
                <Globe className="h-4 w-4 md:h-5 md:w-5 text-[#F5A900]" />
              </div>
              <div>
                <div className="text-[10px] md:text-xs text-fg/50">Indexed</div>
                <div className="text-xs md:text-sm font-medium text-fg truncate">acme.com</div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
              className="absolute top-[65%] left-0 -translate-y-1/2 bg-[#101B30] border border-border rounded-xl p-3 md:p-4 flex items-center gap-3 shadow-xl z-10 w-[140px] md:w-[160px]"
            >
              <div className="h-8 w-8 md:h-10 md:w-10 rounded bg-[#10b981]/10 flex items-center justify-center shrink-0">
                <Database className="h-4 w-4 md:h-5 md:w-5 text-[#10b981]" />
              </div>
              <div>
                <div className="text-[10px] md:text-xs text-fg/50">Synced</div>
                <div className="text-xs md:text-sm font-medium text-fg truncate">Zendesk</div>
              </div>
            </motion.div>

            {/* Central Processing Node */}
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 0.6 }}
              className="absolute top-[45%] right-0 -translate-y-1/2 w-[200px] md:w-[240px] bg-[#0D1727] border border-border rounded-2xl p-4 md:p-5 shadow-[0_0_40px_rgba(245,169,0,0.1)] z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3 md:h-4 md:w-4 text-[#F5A900]" />
                  <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-fg/50">Vector DB</span>
                </div>
                <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
              </div>
              
              <div className="space-y-3">
                <div className="h-1.5 md:h-2 w-full bg-white/5 rounded overflow-hidden">
                  <motion.div 
                    initial={{ x: "-100%" }}
                    whileInView={{ x: "0%" }}
                    transition={{ duration: 2, ease: "circOut", delay: 0.8 }}
                    className="h-full bg-gradient-to-r from-[#F5A900] to-[#10b981]" 
                  />
                </div>
                <div className="flex justify-between text-[10px] md:text-xs text-fg/40 font-mono">
                  <span>Embedding</span>
                  <AnimatedCounter value={12045} />
                </div>
                
                <div className="h-1.5 md:h-2 w-full bg-white/5 rounded overflow-hidden">
                  <motion.div 
                    initial={{ x: "-100%" }}
                    whileInView={{ x: "0%" }}
                    transition={{ duration: 1.5, ease: "circOut", delay: 1.2 }}
                    className="h-full bg-white/20" 
                  />
                </div>
                <div className="flex justify-between text-[10px] md:text-xs text-fg/40 font-mono">
                  <span>Chunks</span>
                  <AnimatedCounter value={4218} delay={1.2} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right side: Chat Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ type: "spring", damping: 30, stiffness: 150 }}
            className="w-full"
          >
            <div className="mb-10">
              <motion.h2 
                style={{ color: useTransform(scrollYProgress, [0, 1], ["#08111F", "#ffffff"]) }}
                className="marketing-h2"
              >
                Zero hallucinations.<br />Total accuracy.
              </motion.h2>
              <motion.p 
                style={{ color: useTransform(scrollYProgress, [0, 1], ["rgba(8,17,31,0.6)", "rgba(255,255,255,0.55)"]) }}
                className="mt-4 max-w-[40ch] text-[17px] leading-[1.65]"
              >
                Ochreshift builds a custom vector database from your content. It cites its sources on every answer.
              </motion.p>
            </div>

            <div className="overflow-hidden rounded-[18px] border border-border bg-[#0D1727] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
              {/* Header */}
              <div className="flex items-center gap-4 border-b border-border bg-[#0b152a] px-6 py-5">
                <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#F5A900] text-bg">
                  <SourceCheckIcon strokeWidth={1.5} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[15px] font-[600] text-fg">Ochreshift AI</p>
                  <p className="flex items-center gap-2 text-[13px] text-fg/40">
                    <span className="h-2 w-2 rounded-full bg-[#16A34A]" /> Online
                  </p>
                </div>
              </div>
              
              {/* Chat Area */}
              <div className="flex flex-col gap-6 p-6 sm:p-8 min-h-[260px]">
                {/* User Message */}
                <motion.div 
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="self-end rounded-[14px] rounded-tr-[4px] bg-[#1a2540] px-6 py-4 text-[15px] text-fg/80 max-w-[75%]"
                >
                  Do you offer online booking?
                </motion.div>

                {/* AI Response */}
                <div className="self-start w-full max-w-[90%]">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="rounded-[14px] rounded-tl-[4px] border border-border/[0.08] bg-[#101B30] px-6 py-6 text-[15px] leading-[1.65] text-fg/70"
                  >
                    {typedText.length === 0 ? (
                      <div className="flex items-center gap-1.5 h-6">
                        <span className="h-2 w-2 rounded-full bg-white/30" style={{ animation: "dots 1.4s ease infinite" }} />
                        <span className="h-2 w-2 rounded-full bg-white/30" style={{ animation: "dots 1.4s ease infinite 0.2s" }} />
                        <span className="h-2 w-2 rounded-full bg-white/30" style={{ animation: "dots 1.4s ease infinite 0.4s" }} />
                      </div>
                    ) : (
                      <p>
                        {typedText}
                        {typedText.length < AI_RESPONSE.length && (
                          <span className="type-caret" />
                        )}
                      </p>
                    )}
                    
                    {/* Sources */}
                    {showSources && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="border-t border-border pt-5 overflow-hidden"
                      >
                        <p className="text-[12px] font-[600] uppercase tracking-wider text-fg/30 mb-3">
                          Sources
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {[
                            { icon: Globe, label: "acme-salon.com/booking" },
                            { icon: BookOpen, label: "FAQ - Appointments" },
                          ].map((s, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1, type: "spring" }}
                              className="flex items-center gap-2 rounded-full border border-border bg-white/[0.06] px-3 py-1.5 text-[12px] text-fg/55 transition-colors hover:bg-white/10 hover:border-border cursor-pointer"
                            >
                              <s.icon strokeWidth={1.5} className="h-3.5 w-3.5 text-[#F5A900]" /> {s.label}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
}

// Simple component to animate a number counting up
function AnimatedCounter({ value, delay = 0 }: { value: number, delay?: number }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let timeout = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += Math.ceil(value / 30);
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(current);
        }
      }, 30);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return <span>{count.toLocaleString()}</span>;
}
