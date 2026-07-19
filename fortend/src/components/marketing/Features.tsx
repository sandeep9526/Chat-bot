import Link from "next/link";
import type { ComponentType } from "react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";
import {
  ArrowRightIcon,
  ClockIcon,
  CodeIcon,
  ContrastIcon,
  DocumentCheckIcon,
  LayoutIcon,
  PaletteIcon,
  SourceCheckIcon,
  SparkleIcon,
} from "./icons";

interface Feature {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  span: string;
  accent?: boolean;
  href?: string;
}

const FEATURES: Feature[] = [
  {
    icon: DocumentCheckIcon,
    title: "Answers only from your content",
    body: "RAG-powered. If it isn't in your docs, Zeva won't make it up. No off-brand answers, ever — just what you actually published.",
    span: "lg:col-span-3",
  },
  {
    icon: SourceCheckIcon,
    title: "Shows its sources",
    body: "Every reply carries a proof card: the source file and a match %. Your customers trust it — and so do you.",
    span: "lg:col-span-3",
    accent: true,
  },
  {
    icon: ClockIcon,
    title: "Captures leads 24/7",
    body: "Night, weekend or festival, Zeva never sleeps. It collects name + phone and never lets a customer slip away.",
    span: "lg:col-span-2",
  },
  {
    icon: CodeIcon,
    title: "One-line embed, any site",
    body: "A single script tag. HTML, WordPress, Shopify, PrestaShop. No npm, no build, no developer.",
    span: "lg:col-span-2",
  },
  {
    icon: PaletteIcon,
    title: "Live Studio",
    body: "Tune colour, corners, font, launcher and glass — and copy your embed code instantly. Changes preview live.",
    span: "lg:col-span-2",
    href: "/studio",
  },
  {
    icon: LayoutIcon,
    title: "Your dashboard",
    body: "Leads, conversations, uploaded docs and a copy-embed button — plus a monthly report in your inbox.",
    span: "lg:col-span-3",
  },
  {
    icon: ContrastIcon,
    title: "Light + dark, glass UI",
    body: "A polished frosted-glass widget that follows your customer's system theme automatically.",
    span: "lg:col-span-3",
  },
  {
    icon: SparkleIcon,
    title: "Fully managed",
    body: "We build it, host it and maintain it. You don't touch a line of code — you just watch the leads arrive.",
    span: "lg:col-span-6",
  },
];

export function Features() {
  return (
    <section id="features" className="border-y border-border bg-panel py-16 sm:py-24">
      <Container>
        <SectionHead
          eyebrow="Features"
          title="Everything a small business needs — nothing it doesn't."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 70} className={f.span}>
              <FeatureCard feature={f} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FeatureCard({ feature: f }: { feature: Feature }) {
  const inner = (
    <div className="card card-hover flex h-full flex-col p-6">
      <span
        className={`grid h-11 w-11 place-items-center rounded-r1 ${
          f.accent ? "bg-good/12 text-good" : "bg-accent-soft text-accent"
        }`}
      >
        <f.icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-[16.5px] font-[750] text-fg">{f.title}</h3>
      <p className="mt-2 max-w-[46ch] text-[14px] leading-[1.6] text-muted">
        {f.body}
      </p>
      {f.href && (
        <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-[650] text-accent">
          Open the Studio
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );

  return f.href ? (
    <Link href={f.href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}
