import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";
import { BoltIcon, ShieldIcon, UsersIcon } from "./icons";
import type { ComponentType } from "react";
import { Clock, MousePointerClick, Repeat } from "lucide-react";

interface Pain {
  icon: ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  body: string;
}

const PAINS: Pain[] = [
  {
    icon: Clock,
    tag: "After-hours visitors",
    title: "The question comes at 9 PM. Your team doesn't.",
    body: "Nights and weekends are exactly when people browse — and exactly when no one is at the desk to reply.",
  },
  {
    icon: Repeat,
    tag: "Repetitive questions",
    title: "Your team answers the same questions every day.",
    body: "Hours are wasted answering 'What are your prices?' instead of focusing on growing the business.",
  },
  {
    icon: MousePointerClick,
    tag: "High-intent visitors",
    title: "Someone is ready to buy. Then they leave.",
    body: "If nobody answers quickly, they bounce to a competitor. The inquiry you never saw is a sale you never made.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-24 bg-bg border-t border-border font-sans">
      <Container>
        <SectionHead
          eyebrow="The problem"
          title="Your website gets visitors. Your team can't answer every question."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PAINS.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div className="h-full p-8 md:p-10 border border-border bg-surface rounded-2xl shadow-lg hover:border-accent/50 transition-colors">
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-accent/10 border border-border text-accent shadow-inner">
                  <p.icon className="h-6 w-6" />
                </span>
                <span className="mt-8 inline-block text-[12px] font-[700] uppercase tracking-widest text-muted">
                  {p.tag}
                </span>
                <h3 className="mt-3 text-[18px] md:text-[20px] font-[700] leading-snug text-fg">
                  {p.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
