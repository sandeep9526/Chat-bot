import { type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { ProductFrame } from "./ProductFrame";
import { ArrowRightIcon, CheckIcon } from "./icons";

/** Small helper so each intro element gets its stagger delay via `--d`. */
function d(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

const REASSURE = ["No credit card", "Works on any site", "Live in minutes"];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border pt-12 pb-16 sm:pt-16 sm:pb-24">
      <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        <div>
          <span className="intro inline-block" style={d(0)}>
            <Eyebrow>AI chat widget for small business</Eyebrow>
          </span>

          <MaskHeadline className="mt-5 font-display text-[clamp(32px,5.4vw,54px)] font-[800] leading-[1.05] tracking-[-.03em] text-fg">
            A chatbot that only answers from{" "}
            <span className="text-accent">your content.</span>
          </MaskHeadline>

          <p
            className="intro mt-5 max-w-[52ch] text-[16.5px] leading-[1.6] text-muted sm:text-[18px]"
            style={d(360)}
          >
            Zeva reads your website, FAQs and docs, then answers your customers
            24/7 — with sources, never made-up — and captures every lead while
            you sleep.
          </p>

          <div className="intro mt-8 flex flex-wrap items-center gap-3" style={d(460)}>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-6 py-3.5 text-[15px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5"
            >
              See a live demo
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-r1 border border-border bg-surface px-6 py-3.5 text-[15px] font-[650] text-fg transition-colors hover:border-accent-ring hover:text-accent"
            >
              Build your bot
            </Link>
          </div>

          <div
            className="intro mt-7 flex flex-wrap gap-x-6 gap-y-2"
            style={d(560)}
          >
            {REASSURE.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-2 text-[13.5px] font-[600] text-muted"
              >
                <CheckIcon className="h-4 w-4 text-good" />
                {r}
              </span>
            ))}
          </div>
        </div>

        <div className="intro" style={d(300)}>
          <ProductFrame />
        </div>
      </Container>
    </section>
  );
}

/**
 * Per-word mask reveal for the H1, animated on LOAD (CSS keyframes) — the hero
 * is the LCP element, so it never waits for hydration. No-JS shows it fully.
 */
function MaskHeadline({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1 className={`mask-h on-load ${className}`}>{splitWords(children)}</h1>
  );
}

/** Wrap each whitespace-separated word (recursing into React nodes) in a mask. */
function splitWords(node: ReactNode, counter = { i: 0 }): ReactNode {
  if (typeof node === "string") {
    return node.split(/(\s+)/).map((chunk, idx) => {
      if (/^\s+$/.test(chunk)) return chunk;
      if (chunk === "") return null;
      const i = counter.i++;
      return (
        <span className="m-word" key={`w-${i}-${idx}`}>
          <span className="m-in" style={{ "--d": `${i * 55}ms` } as CSSProperties}>
            {chunk}
          </span>
        </span>
      );
    });
  }
  if (Array.isArray(node)) {
    return node.map((n, idx) => (
      <span key={`a-${idx}`}>{splitWords(n, counter)}</span>
    ));
  }
  const i = counter.i++;
  return (
    <span className="m-word">
      <span className="m-in" style={{ "--d": `${i * 55}ms` } as CSSProperties}>
        {node}
      </span>
    </span>
  );
}
