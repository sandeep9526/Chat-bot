import { Reveal } from "./Reveal";
import { Container } from "./Container";
import { SectionHead } from "./SectionHead";
import { MessageCircle, FileText, Target, Flame, Bell, Sparkles } from "lucide-react";

const STEPS = [
  { num: "01", icon: MessageCircle, label: "Visitor asks", desc: "Customer asks a question." },
  { num: "02", icon: Sparkles, label: "AI answers", desc: "Instant, grounded response." },
  { num: "03", icon: Target, label: "Buying intent", desc: "AI detects readiness." },
  { num: "04", icon: FileText, label: "Contact captured", desc: "Visitor details saved." },
  { num: "05", icon: Flame, label: "Lead scored", desc: "Hot, Warm, or Cold." },
  { num: "06", icon: Bell, label: "Team alerted", desc: "Human takes over." },
];

export function ProductMechanism() {
  return (
    <section id="how-it-works" className="py-24 bg-bg relative overflow-hidden font-sans">
      <Container>
        <SectionHead
          align="center"
          eyebrow="Workflow"
          title="From question to qualified lead."
          description="We don't just answer questions. We guide your visitors through a proven conversion flow to maximize your website revenue."
          className="mb-20"
        />

        <div className="max-w-6xl mx-auto relative px-4">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 md:gap-4 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-[40px] left-[8%] right-[8%] h-0.5 bg-white/10 -translate-y-1/2" />
            
            {/* Active Line (Desktop) - Just to show flow */}
            <div className="hidden md:block absolute top-[40px] left-[8%] right-[50%] h-0.5 bg-gradient-to-r from-[#FFB800] to-transparent -translate-y-1/2 opacity-60" />
            
            {STEPS.map((step, i) => (
              <div key={step.num} className="w-full md:w-auto flex-1 z-10">
                <Reveal delay={i * 100}>
                  <div className="flex flex-row md:flex-col items-center gap-4 md:gap-5 bg-surface md:bg-transparent p-5 md:p-0 rounded-xl border border-border md:border-transparent">
                    {/* Node */}
                    <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full border-4 flex items-center justify-center transition-all ${
                      i < 3 
                        ? "bg-panel border-bg ring-2 ring-[#FFB800]/50 text-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.15)]" 
                        : "bg-panel border-bg ring-2 ring-white/10 text-muted"
                    }`}>
                      <step.icon size={28} className="md:w-8 md:h-8" />
                    </div>
                    
                    {/* Text content */}
                    <div className="flex flex-col text-left md:text-center">
                      <span className="text-[12px] font-[700] text-[#FFB800] tracking-widest uppercase mb-1">
                        Step {step.num}
                      </span>
                      <span className="text-[16px] font-[700] text-fg leading-tight mb-1">{step.label}</span>
                      <span className="text-[13px] text-muted leading-snug md:max-w-[140px] md:mx-auto mt-0.5">{step.desc}</span>
                    </div>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
