"use client";

import { useEffect, useRef, useState } from "react";
import { SourceCheckIcon } from "./icons";

/**
 * A looping mock conversation that plays when scrolled into view: the customer
 * asks, Zeva "types", answers, then a source proof card slides up with an
 * emerald verified tick. Under reduced motion it renders the finished state and
 * never loops.
 *
 * `step` 0 → empty, 1 → question, 2 → typing, 3 → answer, 4 → source card.
 */
const FULL = 4;

export function AnimatedChat() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let running = false;

    const play = () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
      setStep(0);
      timers.push(setTimeout(() => setStep(1), 500));
      timers.push(setTimeout(() => setStep(2), 1300));
      timers.push(setTimeout(() => setStep(3), 2500));
      timers.push(setTimeout(() => setStep(4), 3300));
      timers.push(setTimeout(play, 7200)); // loop
    };

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0].isIntersecting;
        if (visible && !running) {
          running = true;
          if (reduce) {
            setStep(FULL);
            io.disconnect();
            return;
          }
          play();
        } else if (!visible && running) {
          running = false;
          timers.forEach(clearTimeout);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-[380px]"
      aria-hidden
    >
      <div className="overflow-hidden rounded-r3 border border-border bg-surface shadow-panel">
        {/* header */}
        <div className="flex items-center gap-2.5 border-b border-border bg-panel px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong text-white">
            <SourceCheckIcon className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <p className="m-0 text-[12.5px] font-[750] text-fg">Acme Salon</p>
            <p className="m-0 flex items-center gap-1 text-[10.5px] text-faint">
              <span className="eyebrow-dot" /> Answers from your documents
            </p>
          </div>
        </div>

        {/* stream */}
        <div className="flex min-h-[220px] flex-col gap-2.5 px-4 py-5">
          {step >= 1 && (
            <div
              className="max-w-[80%] self-end rounded-r1 rounded-br-[4px] bg-accent px-3 py-2 text-[13px] font-medium text-white"
              style={{ animation: "msg-in 0.4s ease both" }}
            >
              Are you open on Sunday?
            </div>
          )}

          {step === 2 && (
            <div
              className="flex w-fit items-center gap-1 self-start rounded-r1 rounded-bl-[4px] border border-border bg-panel px-3 py-2.5"
              style={{ animation: "msg-in 0.3s ease both" }}
            >
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 rounded-full bg-muted"
                  style={{ animation: `dots 1s ${d * 0.15}s infinite` }}
                />
              ))}
            </div>
          )}

          {step >= 3 && (
            <div
              className="max-w-[90%] self-start rounded-r1 rounded-bl-[4px] border border-border bg-panel px-3 py-2 text-[13px] leading-[1.5] text-fg"
              style={{ animation: "msg-in 0.4s ease both" }}
            >
              Sundays are appointment-only, 11am–4pm. Saturdays we welcome
              walk-ins until 4pm.
            </div>
          )}

          {step >= 4 && (
            <div
              className="flex w-fit items-center gap-2 self-start rounded-r1 border border-good/45 bg-good/12 px-3 py-2 text-[11.5px] font-[700] text-good"
              style={{ animation: "msg-in 0.45s ease both" }}
            >
              <span className="grid h-4 w-4 place-items-center rounded-full bg-good text-white">
                <SourceCheckIcon className="h-3 w-3" />
              </span>
              From: hours.pdf · 98% match
            </div>
          )}
        </div>

        {/* composer */}
        <div className="border-t border-border bg-panel px-4 py-3">
          <div className="flex items-center justify-between rounded-r1 border border-border bg-surface px-3 py-2">
            <span className="text-[12px] text-faint">Ask a question…</span>
            <span className="text-[11px] font-[700] text-accent">Ask</span>
          </div>
        </div>
      </div>
    </div>
  );
}
