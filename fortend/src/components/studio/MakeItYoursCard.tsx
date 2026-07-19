"use client";

import { useRouter } from "next/navigation";
import { useZevaStore } from "@/stores/zevaStore";
import { savePendingDesign } from "@/lib/pendingDesign";

/**
 * The public Studio's conversion moment. A visitor has just designed their
 * chatbot; instead of a useless embed snippet (they have no account or bot yet),
 * this saves the whole design to localStorage and sends them to sign up — after
 * which the create-bot form is pre-filled with exactly what they built. Shown
 * only on the public /studio (the signed-in ?bot= editor keeps the embed code).
 */
export function MakeItYoursCard() {
  const router = useRouter();
  const config = useZevaStore((s) => s.config);
  const websiteUrl = useZevaStore((s) => s.websiteUrl);

  const go = (to: string) => {
    savePendingDesign(config, websiteUrl);
    router.push(to);
  };

  return (
    <div className="mt-6 overflow-hidden rounded-[22px] border border-accent-ring bg-gradient-to-br from-accent-soft to-transparent shadow-panel">
      <div className="p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[11px] font-[700] uppercase tracking-[.12em] text-accent">
          Your design is ready
        </span>
        <h3 className="mt-3 font-display text-[clamp(20px,3vw,26px)] font-[800] tracking-[-.02em] text-fg">
          Love it? Make it yours.
        </h3>
        <p className="mt-2 max-w-[520px] text-[14px] leading-relaxed text-muted">
          Create your free account and this exact design becomes your live
          chatbot — colour, welcome message and suggestions and all. You won&apos;t
          have to set any of it up again.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => go("/sign-up")}
            className="tap inline-flex items-center gap-2 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-6 py-3 text-[14.5px] font-[700] text-white shadow-[0_10px_24px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5"
          >
            Make it yours
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go("/sign-in")}
            className="tap text-[13.5px] font-[650] text-muted transition-colors hover:text-accent"
          >
            Already have an account? Sign in
          </button>
        </div>
        <p className="mt-4 text-[12px] text-faint">
          Free to start · no credit card · takes about a minute
        </p>
      </div>
    </div>
  );
}
