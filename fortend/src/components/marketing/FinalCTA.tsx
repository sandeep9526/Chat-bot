"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "./Container";
import { Reveal } from "./Reveal";

export function FinalCTA() {
  return (
    <section className="bg-bg w-full font-sans py-28 relative overflow-hidden">
      <Container>
        <Reveal>
          <div className="max-w-[1000px] mx-auto rounded-3xl bg-gradient-to-br from-panel to-bg border border-accent/20 p-12 md:p-24 text-center relative shadow-2xl">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-[40px] md:text-[52px] font-[700] text-fg mb-6 tracking-tight leading-[1.1]">
                Turn your unanswered questions into qualified leads.
              </h2>

              <p className="text-[18px] text-muted mb-12 max-w-xl mx-auto leading-relaxed">
                Answer questions instantly, qualify automatically, and capture every valuable lead before they leave your site.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link
                  href="/sign-up"
                  className="w-full sm:w-auto bg-accent text-[#08111F] font-[600] px-8 py-4 text-[16px] rounded-md hover:bg-accent-strong transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  Start free
                </Link>
                <Link
                  href="/demo"
                  className="w-full sm:w-auto text-fg border border-border bg-fg/5 px-8 py-4 text-[16px] font-[500] rounded-md hover:bg-fg/10 transition-colors flex items-center justify-center gap-2"
                >
                  Try the live demo
                  <ArrowRight size={18} className="text-muted" />
                </Link>
              </div>

              <p className="text-[13px] text-muted mt-8 font-[500] flex flex-wrap items-center justify-center gap-x-3 gap-y-2 tracking-wide">
                <span>14-day free trial</span>
                <span className="w-1.5 h-1.5 rounded-full bg-muted" aria-hidden />
                <span>No credit card required</span>
                <span className="w-1.5 h-1.5 rounded-full bg-muted" aria-hidden />
                <span>Cancel anytime</span>
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
