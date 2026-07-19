import type { ComponentType } from "react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";
import { LockIcon, ShieldIcon, SlidersIcon, SourceCheckIcon } from "./icons";

interface Guarantee {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

/**
 * Trust band. Every claim is a real property of how Zeva works (grounded RAG,
 * cited sources, per-tenant isolation, owner control) — no invented
 * certifications or badges.
 */
const PROMISES: Guarantee[] = [
  {
    icon: ShieldIcon,
    title: "Grounded, never guessing",
    body: "Zeva answers only from the documents you give it. If the answer isn't there, it says so — it never invents hours, prices or promises.",
  },
  {
    icon: SourceCheckIcon,
    title: "Every answer is sourced",
    body: "Each reply shows the exact file it came from and a match score. Nothing your customers — or you — have to take on faith.",
  },
  {
    icon: LockIcon,
    title: "Your content, your bot",
    body: "Your documents power only your bot. Every business gets its own isolated knowledge base — never mixed with anyone else's.",
  },
  {
    icon: SlidersIcon,
    title: "You stay in control",
    body: "You decide what it's trained on, see every document in your dashboard, and update or remove it whenever you like.",
  },
];

export function SecurityBand() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <SectionHead
          eyebrow="Built to be trusted"
          title="The safe way to put AI on your website."
          description={
            <>
              &ldquo;Will it say something wrong?&rdquo; is the first thing
              every owner asks. Zeva is built so the answer is no — by design,
              not by hope.
            </>
          }
        />

        <div className="mt-11 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
          {PROMISES.map((p, i) => (
            <Reveal key={p.title} delay={i * 70}>
              <div className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-r1 bg-good/12 text-good">
                  <p.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[16px] font-[750] text-fg">{p.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-muted">
                    {p.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
