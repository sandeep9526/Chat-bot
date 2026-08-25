import { Reveal } from "./Reveal";
import { Container } from "./Container";
import { SectionHead } from "./SectionHead";
import {
  MessageCircle,
  Sparkles,
  Target,
  FileText,
  Flame,
  Bell,
  MessagesSquare,
  UserCheck,
  PhoneCall,
} from "lucide-react";

interface PhaseStep {
  icon: typeof MessageCircle;
  label: string;
}

interface Phase {
  num: string;
  icon: typeof MessageCircle;
  title: string;
  desc: string;
  steps: PhaseStep[];
}

const PHASES: Phase[] = [
  {
    num: "01",
    icon: MessagesSquare,
    title: "Visitors ask. AI answers.",
    desc: "Instant, grounded responses — every answer cited from your own content.",
    steps: [
      { icon: MessageCircle, label: "Visitor asks a question" },
      { icon: Sparkles, label: "AI answers from your knowledge" },
    ],
  },
  {
    num: "02",
    icon: UserCheck,
    title: "Capture & qualify.",
    desc: "Every conversation quietly turns into a scored lead while intent is high.",
    steps: [
      { icon: Target, label: "Buying intent detected" },
      { icon: FileText, label: "Contact details captured" },
      { icon: Flame, label: "Lead scored Hot, Warm, or Cold" },
    ],
  },
  {
    num: "03",
    icon: PhoneCall,
    title: "Your team closes.",
    desc: "Hot leads alert your team instantly, so a human steps in at the perfect moment.",
    steps: [{ icon: Bell, label: "Team alerted — human takes over" }],
  },
];

export function ProductMechanism() {
  return (
    <section id="how-it-works" className="py-24 bg-bg scroll-mt-20 relative overflow-hidden font-sans">
      <Container>
        <SectionHead
          align="center"
          eyebrow="Workflow"
          title="From question to qualified lead."
          description="We don't just answer questions. We guide your visitors through a proven conversion flow to maximize your website revenue."
          className="mb-20"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {PHASES.map((phase, i) => (
            <Reveal key={phase.num} delay={i * 110} className="h-full">
              <div
                className={`relative flex flex-col h-full bg-surface border rounded-2xl p-8 transition-colors ${
                  i === 2
                    ? "border-accent/40 shadow-[0_0_30px_-10px_rgba(245,169,0,0.18)]"
                    : "border-border shadow-card hover:border-accent/30"
                }`}
              >
                <div className="flex items-center justify-between mb-8">
                  <div
                    className={`w-14 h-14 shrink-0 rounded-full border-4 flex items-center justify-center ${
                      i === 2
                        ? "bg-panel border-accent/20 ring-2 ring-accent/50 text-accent shadow-[0_0_15px_rgba(245,169,0,0.25)]"
                        : "bg-panel border-bg ring-2 ring-accent/50 text-accent"
                    }`}
                  >
                    <phase.icon size={26} />
                  </div>
                  <span className="text-[13px] font-[700] text-faint tracking-[0.2em] font-mono">
                    {phase.num}
                  </span>
                </div>

                <h3 className="text-[19px] md:text-[20px] font-[700] text-fg leading-tight mb-2.5">
                  {phase.title}
                </h3>
                <p className="text-[14.5px] leading-relaxed text-muted mb-7">{phase.desc}</p>

                <ul className="mt-auto flex flex-col gap-3 pt-2 border-t border-border">
                  {phase.steps.map((step) => (
                    <li key={step.label} className="flex items-center gap-3 text-[14px] text-muted">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-panel border border-border text-accent shrink-0">
                        <step.icon size={15} />
                      </span>
                      {step.label}
                    </li>
                  ))}
                </ul>

                {i < 2 && (
                  <span
                    aria-hidden
                    className="hidden md:block absolute top-1/2 -right-[13px] w-[26px] h-[26px] rotate-45 border-r border-b border-accent/40 -translate-y-1/2 z-10"
                  />
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
