import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  FileText,
  FileSpreadsheet,
  HelpCircle,
  FileImage,
  Globe,
} from "lucide-react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";
import { WORKS_WITH } from "./ProofBar";

const STEPS = [
  {
    title: "Create your agent",
    desc: "Name it, pick its personality, set boundaries.",
  },
  {
    title: "Upload your knowledge",
    desc: "Feed it what you already have — it learns instantly.",
  },
  {
    title: "Paste one script tag",
    desc: "Drop a single line before </body>. Works on any website.",
  },
];

const KNOWLEDGE_INPUTS = [
  { icon: FileText, label: "PDFs & Docs" },
  { icon: FileSpreadsheet, label: "Price Sheets" },
  { icon: HelpCircle, label: "FAQs & TXT" },
  { icon: FileImage, label: "Scanned Menus" },
  { icon: Globe, label: "Your Web Pages" },
];

export function InstallationSpeed() {
  return (
    <div className="font-sans pt-8">
      <Container>
        <SectionHead
          align="center"
          eyebrow="Setup Speed"
          title="Ready in minutes, not weeks."
          description="No complex integrations required. Set up your AI assistant instantly using your existing content."
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1060px] mx-auto">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 100} className="h-full">
              <div className="relative bg-surface border border-border rounded-2xl p-8 h-full shadow-card hover:border-accent/40 transition-colors">
                <div className="flex items-center gap-4 mb-5">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-panel border border-accent/40 text-accent font-mono text-[15px] font-[700] shrink-0">
                    {i + 1}
                  </span>
                  {i < 2 && (
                    <ArrowRight
                      size={20}
                      aria-hidden
                      className="hidden md:block text-faint absolute top-9 -right-[42px]"
                    />
                  )}
                  <h3 className="text-[18px] font-[700] text-fg leading-snug">{step.title}</h3>
                </div>
                <p className="text-[14.5px] leading-relaxed text-muted">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="max-w-[1060px] mx-auto mt-6 mb-12 rounded-2xl border border-border bg-surface p-6 md:p-7 shadow-sm">
            <p className="text-center text-[12.5px] font-[700] uppercase tracking-widest text-faint mb-6">
              No flowcharts. No training data. Just feed it what you already have.
            </p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {KNOWLEDGE_INPUTS.map((input) => (
                <li
                  key={input.label}
                  className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-panel px-3 py-4 text-center transition-colors hover:border-accent/40"
                >
                  <input.icon size={20} className="text-[#FFB800]" />
                  <span className="text-[13px] font-[600] text-muted leading-tight">{input.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={250}>
          <div className="max-w-[720px] mx-auto mt-10">
            <div
              aria-label="Example embed code"
              className="rounded-xl overflow-hidden border border-[#1e2a44] bg-[#0c1222] shadow-lg"
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2a44] bg-[#101830]">
                <span className="font-mono text-[12px] text-[#7c8aad]">index.html</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#7c8aad]">
                  <Copy size={12} /> one line — that&apos;s the whole install
                </span>
              </div>
              <pre className="px-5 py-4 overflow-x-auto font-mono text-[13px] leading-relaxed">
                <code>
                  <span className="text-[#7c8aad]">&lt;!-- paste before &lt;/body&gt; --&gt;</span>
                  {"\n"}
                  <span className="text-[#c792ea]">&lt;script</span>
                  {"\n  "}
                  <span className="text-[#89ddff]">src</span>
                  <span className="text-[#c9d4f2]">=</span>
                  <span className="text-[#c3e88d]">&quot;https://cdn.ochreshift.app/widget.js&quot;</span>
                  {"\n  "}
                  <span className="text-[#89ddff]">data-bot-id</span>
                  <span className="text-[#c9d4f2]">=</span>
                  <span className="text-[#c3e88d]">&quot;your-agent&quot;</span>
                  {"\n  "}
                  <span className="text-[#89ddff]">async</span>
                  <span className="text-[#c792ea]">&gt;&lt;/script&gt;</span>
                </code>
              </pre>
            </div>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {["Any platform", "No plugins", "Matches your brand"].map((point) => (
                <li key={point} className="flex items-center gap-2 text-[13.5px] text-muted font-[500]">
                  <Check size={15} className="text-emerald-500" strokeWidth={2.5} /> {point}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-center text-[13px] text-faint flex flex-wrap justify-center gap-x-2">
              <span>Works with</span>
              {WORKS_WITH.map((platform, i) => (
                <span key={platform} className="text-muted font-[500]">
                  {platform}
                  {i < WORKS_WITH.length - 1 && <span className="text-border ml-2">·</span>}
                </span>
              ))}
            </p>

            <div className="mt-8 text-center">
              <Link href="/sign-up" className="inline-flex items-center gap-2 bg-accent text-[#08111F] font-[600] px-7 py-3.5 rounded-md hover:bg-accent-strong transition-colors">
                Create your first agent
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
