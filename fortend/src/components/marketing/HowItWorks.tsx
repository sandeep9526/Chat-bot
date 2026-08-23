import { UploadCloud, Code, Sparkles, Handshake } from "lucide-react";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    icon: UploadCloud,
    title: "Upload Your Knowledge",
    body: "Drop in PDFs, FAQs, price sheets, docs, or phone photos.",
  },
  {
    icon: Code,
    title: "Embed Anywhere",
    body: "Copy one line of script into your website.",
  },
  {
    icon: Sparkles,
    title: "AI Resolves & Qualifies",
    body: "Visitors receive answers and high-intent visitors are qualified.",
  },
  {
    icon: Handshake,
    title: "You Close the Deal",
    body: "Receive a lead alert or take over the conversation instantly.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-white py-16 sm:py-24 border-b border-[#E5E7EB] font-sans">
      <div className="max-w-7xl mx-auto px-6">
        
        <Reveal>
          <div className="text-center max-w-[560px] mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 mb-6 tracking-wide uppercase">
              How it works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-bg leading-tight">
              From data to answers <br className="hidden sm:block" /> in minutes.
            </h2>
          </div>
        </Reveal>

        {/* Stepped timeline */}
        <div className="relative mt-14 max-w-6xl mx-auto">
          {/* Connector line (desktop) */}
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-[24px] hidden h-[2px] lg:block overflow-hidden rounded-full bg-[#F8F8F6]">
            <Reveal
              variant="line"
              className="block h-full w-full origin-left bg-[#FFB800]"
              style={{ transitionDuration: "1.5s" } as React.CSSProperties}
            />
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 150} className="relative text-center flex flex-col items-center">
                <div className="relative z-10 flex h-[50px] w-[50px] items-center justify-center rounded-full border-[2px] border-border bg-[#F8F8F6] text-bg shadow-[0_4px_12px_rgba(8,17,31,0.06)] transition-transform duration-300 hover:scale-110">
                  <step.icon strokeWidth={1.5} className="h-5 w-5" />
                </div>
                <div className="mt-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#FFB800]/10 text-[13px] font-[700] text-[#FFB800]">
                  0{i + 1}
                </div>
                <h3 className="mt-4 text-[18px] font-[600] text-bg">
                  {step.title}
                </h3>
                <p className="mt-2.5 max-w-[24ch] text-[15px] leading-[1.6] text-[#475569]">
                  {step.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Compatibility tags */}
        <Reveal className="mt-24">
          <p className="text-center text-[12px] font-[600] uppercase tracking-wider text-[#94a3b8]">
            Works seamlessly with your existing website
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {PLATFORMS.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-[13px] font-[500] text-[#475569] shadow-sm transition-colors hover:border-[#FFB800]/40 hover:bg-[#F8F8F6]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800]" />
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const PLATFORMS = [
  "HTML",
  "WordPress",
  "Shopify",
  "Webflow",
  "Wix",
  "Squarespace",
];
