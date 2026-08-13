import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";
import { BoltIcon, ShieldIcon, UsersIcon } from "./icons";
import type { ComponentType } from "react";

interface Pain {
  icon: ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  body: string;
}

/**
 * Honest by design: no invented statistics. Each card states a real, self-
 * evident pain a small business already feels.
 */
const PAINS: Pain[] = [
  {
    icon: UsersIcon,
    tag: "After hours",
    title: "The questions come when you're closed",
    body: "Nights, weekends and festivals are exactly when people browse — and exactly when no one is at the desk to reply.",
  },
  {
    icon: BoltIcon,
    tag: "Too slow",
    title: "A late reply is a lost customer",
    body: "If nobody answers quickly, the next tab is a competitor. The enquiry you never saw is a sale you never made.",
  },
  {
    icon: ShieldIcon,
    tag: "Off-brand",
    title: "Generic bots make things up",
    body: "Off-the-shelf chatbots hallucinate — quoting prices you never set and promising things you never offered.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <SectionHead
          eyebrow="The problem"
          title="Your customers ask after hours. Nobody answers."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PAINS.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div className="card card-hover h-full p-6">
                <span className="grid h-11 w-11 place-items-center rounded-r1 bg-accent-soft text-accent">
                  <p.icon className="h-5 w-5" />
                </span>
                <span className="mt-4 inline-block rounded-full border border-border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[.12em] text-faint">
                  {p.tag}
                </span>
                <h3 className="mt-3 text-[17px] font-[750] leading-snug text-fg">
                  {p.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-muted">
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
