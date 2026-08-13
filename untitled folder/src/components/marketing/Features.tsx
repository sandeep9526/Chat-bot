import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRightIcon, DocumentCheckIcon, SourceCheckIcon, ClockIcon, CodeIcon, PaletteIcon, LayoutIcon, ContrastIcon, SparkleIcon } from "./icons";
import { Reveal } from "./Reveal";

interface Feature {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  href?: string;
}

const FEATURES: Feature[] = [
  {
    icon: DocumentCheckIcon,
    title: "Answers only from your content",
    body: "RAG-powered. If it isn't in your docs, Ochreshift won't make it up. No off-brand answers, ever — just what you actually published.",
  },
  {
    icon: SourceCheckIcon,
    title: "Shows its sources",
    body: "Every reply carries a proof card: the source file and a match %. Your customers trust it — and so do you.",
  },
  {
    icon: ClockIcon,
    title: "Captures leads 24/7",
    body: "Night, weekend or festival, Ochreshift never sleeps. It collects name + phone and never lets a customer slip away.",
  },
  {
    icon: CodeIcon,
    title: "One-line embed, any site",
    body: "A single script tag. HTML, WordPress, Shopify, PrestaShop. No npm, no build, no developer.",
  },
  {
    icon: PaletteIcon,
    title: "Live Studio",
    body: "Tune color, corners, font, launcher and glass — and copy your embed code instantly. Changes preview live.",
    href: "/dashboard#appearance",
  },
  {
    icon: LayoutIcon,
    title: "Your dashboard",
    body: "Leads, conversations, uploaded docs and a copy-embed button — plus a monthly report in your inbox.",
  },
  {
    icon: ContrastIcon,
    title: "Light + dark, glass UI",
    body: "A polished frosted-glass widget that follows your customer's system theme automatically.",
  },
  {
    icon: SparkleIcon,
    title: "Fully managed",
    body: "We build it, host it and maintain it. You don't touch a line of code — you just watch the leads arrive.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white section-normal">
      <div className="marketing-container">
        
        <Reveal>
          <div className="text-center max-w-[560px] mx-auto mb-14">
            <span className="eyebrow">
              CAPABILITIES
            </span>
            <h2 className="mt-5 marketing-h2">
              Everything a small business needs.
            </h2>
            <p className="mt-5 text-[17px] text-[#475569]">
              Powerful features without the unnecessary complexity.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 60}>
              <FeatureCard feature={f} />
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}

function FeatureCard({ feature: f }: { feature: Feature }) {
  const inner = (
    <div className="group flex h-full flex-col rounded-[14px] border border-[#E5E7EB] bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_-8px_rgba(8,17,31,0.08)] hover:border-[#F5A900]/25">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#F8F8F6] text-[#08111F] transition-colors duration-200 group-hover:bg-[#F5A900]/10 group-hover:text-[#F5A900]">
        <f.icon strokeWidth={1.5} className="h-6 w-6" />
      </div>
      <h3 className="text-[16px] font-[600] text-[#08111F]">{f.title}</h3>
      <p className="mt-2.5 text-[14px] leading-[1.65] text-[#475569]">
        {f.body}
      </p>
      {f.href && (
        <span className="mt-auto pt-5 flex items-center gap-1.5 text-[14px] font-[600] text-[#F5A900] transition-transform duration-150 group-hover:translate-x-0.5">
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
