"use client";

import { type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ProductFrame } from "./ProductFrame";
import { ArrowRightIcon } from "./icons";

function d(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-[#08111F] text-white">
      {/* Subtle background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent" />
      <div className="absolute left-[10%] top-[15%] h-[400px] w-[400px] rounded-full bg-[#F5A900]/[0.06] blur-[140px]" />
      <div className="absolute right-[15%] bottom-[10%] h-[300px] w-[300px] rounded-full bg-[#F5A900]/[0.04] blur-[120px]" />
      {/* Dot grid texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[size:24px_24px]" />

      <section className="relative flex min-h-[580px] lg:min-h-[640px] flex-col justify-center py-20 sm:py-24 lg:py-28">
        <div className="marketing-container grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          
          <div className="relative z-10">
            <span 
              className="intro inline-block text-[13px] font-[600] uppercase tracking-[0.12em] text-[#F5A900]" 
              style={d(0)}
            >
              BUILD. DEPLOY. SCALE.
            </span>

            <MaskHeadline className="mt-6 font-display text-[clamp(40px,5.5vw,64px)] font-[700] leading-[1.0] tracking-[-0.03em] text-white">
              Shift your ideas <br />
              into <span className="text-[#F5A900]">powerful</span> solutions.
            </MaskHeadline>

            <p
              className="intro mt-7 max-w-[44ch] text-[17px] leading-[1.65] text-white/55"
              style={d(360)}
            >
              Ochreshift helps developers and teams build, deploy and scale modern web applications with ease.
            </p>

            <div className="intro mt-9 flex flex-wrap items-center gap-4" style={d(480)}>
              <Link
                href="/sign-up"
                className="btn-primary btn-shine h-[48px] px-8 text-[16px]"
              >
                Get Started
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex h-[48px] items-center justify-center rounded-[10px] border border-white/15 bg-transparent px-8 text-[16px] font-[600] text-white transition-all duration-150 hover:bg-white/5 hover:border-white/25"
              >
                View Documentation
              </Link>
            </div>
          </div>

          <div className="intro relative z-10 w-full" style={d(300)}>
            {/* Geometric decoration behind mockup */}
            <div className="absolute top-1/2 left-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-10 hidden lg:block">
              <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                <circle cx="250" cy="250" r="220" stroke="#F5A900" strokeWidth="0.8" strokeDasharray="6 6" />
                <circle cx="250" cy="250" r="160" stroke="#F5A900" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="250" y1="30" x2="250" y2="470" stroke="#F5A900" strokeWidth="0.3" strokeDasharray="3 6" />
                <line x1="30" y1="250" x2="470" y2="250" stroke="#F5A900" strokeWidth="0.3" strokeDasharray="3 6" />
              </svg>
            </div>
            {/* Floating mockup */}
            <div className="float-a">
              <ProductFrame />
            </div>
          </div>
          
        </div>
      </section>
    </div>
  );
}

function MaskHeadline({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={`mask-h on-load ${className}`}>{splitWords(children)}</h1>
  );
}

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
