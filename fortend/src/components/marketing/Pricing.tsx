import Link from "next/link";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";
import { ArrowRightIcon, CheckIcon } from "./icons";

interface Tier {
  name: string;
  blurb: string;
  features: string[];
  highlighted?: boolean;
}

/**
 * Billing isn't built yet, so this never shows a live price or a checkout
 * button — only an illustrative tier shape, clearly labeled, linking to the one
 * real, working flow (account creation). No invented numbers.
 */
const TIERS: Tier[] = [
  {
    name: "Starter",
    blurb: "One bot, one website, the essentials.",
    features: [
      "1 chat bot",
      "Core document upload",
      "Lead capture",
      "One script-tag embed",
    ],
  },
  {
    name: "Growth",
    blurb: "For businesses adding more content and traffic.",
    features: [
      "Everything in Starter",
      "Larger document library",
      "Custom branding in Studio",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Scale",
    blurb: "For teams running several bots or sites.",
    features: [
      "Everything in Growth",
      "Multiple bots",
      "Team access",
      "White-label widget",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-y border-border bg-panel py-16 sm:py-24">
      <Container>
        <SectionHead
          eyebrow="Pricing"
          title="Build once. Grow every month."
          description="We're finalizing billing right now. The tiers below show the shape of what's coming — features and pricing may change before launch."
        />

        <div className="mt-12 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 90} className="h-full">
              <div
                className={`card flex h-full flex-col p-7 ${
                  tier.highlighted ? "border-accent-ring ring-1 ring-accent-ring" : ""
                }`}
              >
                {tier.highlighted && (
                  <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[10.5px] font-[750] uppercase tracking-[.1em] text-accent">
                    Most popular
                  </span>
                )}
                <h3 className="text-[18px] font-[750] text-fg">{tier.name}</h3>
                <p className="mt-1.5 text-[13.5px] text-muted">{tier.blurb}</p>
                <p className="mt-5 font-mono text-[13.5px] font-[650] text-faint">
                  Pricing coming soon
                </p>
                <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[13.5px] text-fg"
                    >
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-good" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className={`mt-7 inline-flex items-center justify-center rounded-r1 px-5 py-3 text-[14px] font-[650] transition-transform hover:-translate-y-0.5 ${
                    tier.highlighted
                      ? "bg-gradient-to-br from-accent to-accent-strong text-white shadow-[0_8px_20px_-8px_var(--accent)]"
                      : "border border-border bg-surface text-fg hover:border-accent-ring hover:text-accent"
                  }`}
                >
                  Get started
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal
          as="p"
          className="mt-8 text-center font-mono text-[11px] uppercase tracking-[.1em] text-faint"
        >
          Illustrative tier structure — not final pricing
        </Reveal>

        {/* Don't dead-end at "coming soon" — give a serious buyer a next step. */}
        <Reveal className="mt-10">
          <div className="card mx-auto flex max-w-[720px] flex-col items-center gap-4 border-accent-ring p-7 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-[15.5px] font-[750] text-fg">
                Want a number for your business?
              </p>
              <p className="mt-1 text-[13.5px] text-muted">
                See Zeva working on your own site first — we&apos;ll walk you
                through pricing in the demo. No card, no commitment.
              </p>
            </div>
            <Link
              href="/demo"
              className="inline-flex shrink-0 items-center gap-2 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-5 py-3 text-[14.5px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5"
            >
              See a live demo
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
