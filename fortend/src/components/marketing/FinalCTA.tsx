import Link from "next/link";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { ArrowRightIcon, CheckIcon } from "./icons";

const PROMISES = [
  "A free bot trained on your own site",
  "Watch it answer your real questions",
  "No card, no commitment",
];

/**
 * Bold, high-contrast closing panel — a familiar, Amazon-style "final push":
 * strong accent background, white text, concrete risk-reversal. Clear over
 * cinematic.
 */
export function FinalCTA() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-r3 bg-gradient-to-br from-accent to-accent-strong px-6 py-14 text-center shadow-panel sm:px-12 sm:py-20">
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(60% 90% at 50% -10%, rgba(255,255,255,0.18), transparent 70%)",
              }}
            />
            <div className="relative">
              <h2 className="mx-auto max-w-[16ch] font-display text-[clamp(28px,5vw,50px)] font-[800] leading-[1.05] tracking-[-.03em] text-white">
                Stop losing leads at 2am.
              </h2>
              <p className="mx-auto mt-5 max-w-[52ch] text-[16px] leading-[1.6] text-white/85 sm:text-[17px]">
                See Zeva answer your own questions before you decide. We&apos;ll
                train a bot on your site and show it live in one short demo.
              </p>

              <div className="mx-auto mt-7 flex max-w-[640px] flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
                {PROMISES.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-2 text-[13.5px] font-[600] text-white"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    {p}
                  </span>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-r1 bg-white px-7 py-3.5 text-[15.5px] font-[700] text-accent shadow-[0_10px_24px_-8px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5"
                >
                  See a live demo
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 rounded-r1 border border-white/40 bg-white/10 px-7 py-3.5 text-[15.5px] font-[650] text-white transition-colors hover:bg-white/20"
                >
                  Build your bot
                </Link>
              </div>
              <p className="mt-6 font-mono text-[12px] text-white/70">
                No credit card · The demo runs right in your browser
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
