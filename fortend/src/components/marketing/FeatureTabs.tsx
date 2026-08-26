"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "./Container";
import { SectionHead } from "./SectionHead";
import { ProductMechanism } from "./ProductMechanism";
import { GroundedAnswers } from "./GroundedAnswers";
import { LeadQualification } from "./LeadQualification";
import { HumanTakeover } from "./HumanTakeover";
import { InstallationSpeed } from "./InstallationSpeed";
import { MessagesSquare, CheckCircle2, Flame, Hand, Zap } from "lucide-react";

const TABS = [
  { id: "workflow", label: "Workflow", icon: MessagesSquare, component: ProductMechanism },
  { id: "grounded", label: "Fact-Verified", icon: CheckCircle2, component: GroundedAnswers },
  { id: "scoring", label: "Lead Scoring", icon: Flame, component: LeadQualification },
  { id: "handoff", label: "Seamless Handoff", icon: Hand, component: HumanTakeover },
  { id: "speed", label: "Setup Speed", icon: Zap, component: InstallationSpeed },
];

export function FeatureTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const ActiveComponent = TABS[activeTab].component;

  return (
    <section 
      id="features" 
      className="py-24 bg-bg border-t border-border overflow-hidden font-sans"
    >
      <Container>
        <SectionHead
          align="center"
          eyebrow="Platform Features"
          title="Everything you need to capture leads."
          description="A complete toolkit designed to turn casual website visitors into qualified, high-intent leads for your service business."
          className="mb-12"
        />

        {/* Tab Navigation - Segmented Control Style */}
        <div className="flex flex-col items-center mb-16">
          <div className="flex overflow-x-auto w-full md:w-auto md:justify-center p-1.5 bg-surface/50 border border-border rounded-full scrollbar-hide snap-x relative shadow-sm">
            {TABS.map((tab, idx) => {
              const isActive = activeTab === idx;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`relative snap-center shrink-0 flex items-center gap-2 px-6 py-3 rounded-full text-[14.5px] font-[600] transition-colors z-10 ${
                    isActive ? "text-[#08111F]" : "text-muted hover:text-fg"
                  }`}
                >
                  {/* Sliding Background Highlight */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-accent rounded-full -z-10 shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <tab.icon size={16} className={isActive ? "text-[#08111F]" : ""} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-[13px] text-faint flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent/50 animate-pulse" />
            Click the tabs above to explore features
          </p>
        </div>
      </Container>

      {/* Tab Content with Animation */}
      <div className="w-full relative min-h-[950px] lg:min-h-[700px] pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.95, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.05, y: -30, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
