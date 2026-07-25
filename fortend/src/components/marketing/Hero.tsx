"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { ProductFrame } from "./ProductFrame";
import { ArrowRightIcon, CheckIcon } from "./icons";
import { Zap, Loader2 } from "lucide-react";
import { useZevaStore } from "@/stores/zevaStore";

/** Small helper so each intro element gets its stagger delay via `--d`. */
function d(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

const REASSURE = ["No credit card", "Works on any site", "Live in minutes"];

export function Hero() {
  const [testUrl, setTestUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const setOpen = useZevaStore((s) => s.setOpen);
  const setWebsiteUrl = useZevaStore((s) => s.setWebsiteUrl);
  const setBotId = useZevaStore((s) => s.setBotId);
  const setName = useZevaStore((s) => s.setName);
  const setWelcome = useZevaStore((s) => s.setWelcome);
  const setSuggestions = useZevaStore((s) => s.setSuggestions);
  const resetSession = useZevaStore((s) => s.resetSession);


  const handleTestBot = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl = testUrl.trim() || "https://zeva.ai";
    setLoading(true);
    resetSession();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const resp = await fetch(`${apiUrl}/demo/ingest-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.botId) {
          setBotId(data.botId);
          setName(data.name || targetUrl);
          setWelcome(data.welcome || `Welcome to ${data.name}!`);
          setSuggestions(data.suggestions || []);
          setWebsiteUrl(targetUrl);
        }
      }
    } catch (err) {
      console.warn("Hero scrape error:", err);
      setWebsiteUrl(targetUrl);
    } finally {
      setLoading(false);
      setOpen(true);
    }
  };


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

          {/* Instant Hero Website URL Tester */}
          <form
            onSubmit={handleTestBot}
            className="intro mt-7 flex max-w-[520px] items-center gap-2 rounded-[12px] border border-accent/30 bg-surface/80 p-2 shadow-panel backdrop-blur max-sm:flex-col max-sm:p-3"
            style={d(420)}
          >
            <input
              type="text"
              placeholder="Enter website URL (e.g. yourcompany.com)"
              aria-label="Website URL"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-[14px] text-fg outline-none placeholder:text-faint"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-5 py-2.5 text-[13.5px] font-[650] text-white shadow-panel transition-transform hover:scale-[1.02] cursor-pointer disabled:opacity-50 max-sm:w-full"
            >
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Scraping Site...</>) : (<><Zap className="h-4 w-4" /> Test Bot Now</>)}
            </button>
          </form>


          <div className="intro mt-6 flex flex-wrap items-center gap-3" style={d(480)}>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-6 py-3.5 text-[15px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5"
            >
              See a live demo
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard#appearance"
              className="inline-flex items-center gap-2 rounded-r1 border border-border bg-surface px-6 py-3.5 text-[15px] font-[650] text-fg transition-colors hover:border-accent-ring hover:text-accent"
            >
              Customize in Studio
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
