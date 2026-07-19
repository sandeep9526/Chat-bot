import { Container } from "./Container";
import { CopyEmbed } from "./CopyEmbed";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";
import { CodeIcon, PaletteIcon, RocketIcon, UploadIcon } from "./icons";
import type { ComponentType } from "react";

interface Step {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: UploadIcon,
    title: "Feed it your content",
    body: "Drop your website URL, FAQs, price list and docs. Zeva ingests and indexes everything in minutes.",
  },
  {
    icon: PaletteIcon,
    title: "Make it yours",
    body: "Match your brand in the Studio: accent colour, corners, font, launcher, light or dark.",
  },
  {
    icon: CodeIcon,
    title: "Embed one line",
    body: "Paste a single <script> tag. HTML, WordPress, Shopify, PrestaShop — no build step.",
  },
  {
    icon: RocketIcon,
    title: "Watch leads roll in",
    body: "Zeva answers 24/7 with sources and captures name + phone. Every lead lands in your dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-16 sm:py-24">
      <Container>
        <SectionHead
          eyebrow="How it works"
          title="Live in a few steps — you touch no code."
        />

        {/* Stepped timeline */}
        <div className="relative mt-14">
          {/* connector line (desktop) that draws in on scroll */}
          <div className="pointer-events-none absolute left-0 right-0 top-[26px] hidden h-px bg-border lg:block">
            <Reveal
              variant="line"
              className="block h-full bg-gradient-to-r from-accent via-accent to-good"
            />
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 110} className="relative">
                <div className="flex items-center gap-3 lg:block">
                  <span className="relative z-10 grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border border-accent-ring bg-bg text-[15px] font-[800] text-accent shadow-panel">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="grid h-10 w-10 place-items-center rounded-r1 bg-accent-soft text-accent lg:mt-5">
                    <step.icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="mt-4 text-[16.5px] font-[750] text-fg">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[30ch] text-[14px] leading-[1.6] text-muted">
                  {step.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* The embed line, front and centre */}
        <div className="mt-16 grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <p className="font-mono text-[11.5px] uppercase tracking-[.14em] text-accent">
              Step 3, in full
            </p>
            <h3 className="mt-3 font-display text-[clamp(22px,3vw,30px)] font-[750] leading-tight tracking-[-.02em] text-fg">
              One script tag. That&apos;s the whole install.
            </h3>
            <p className="mt-3 max-w-[42ch] text-[14.5px] leading-[1.65] text-muted">
              No npm, no build, no developer. Paste it once and the widget
              appears — already trained, already branded, already capturing
              leads. We host and maintain it for you.
            </p>
          </Reveal>
          <Reveal delay={120} variant="zoom">
            <CopyEmbed />
          </Reveal>
        </div>

        {/* Truthful compatibility — one script tag works on any stack */}
        <Reveal className="mt-14">
          <p className="text-center text-[12px] font-[600] uppercase tracking-[.14em] text-faint">
            Paste it on whatever you already built on
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {PLATFORMS.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-2 rounded-r2 border border-border bg-surface/60 px-3.5 py-2 text-[13px] font-[650] text-muted backdrop-blur"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-accent to-good" />
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

const PLATFORMS = [
  "WordPress",
  "Shopify",
  "WooCommerce",
  "Wix",
  "Squarespace",
  "Webflow",
  "PrestaShop",
  "Plain HTML",
];
