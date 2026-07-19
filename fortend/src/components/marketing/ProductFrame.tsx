import { SourceCheckIcon } from "./icons";

/**
 * A concrete "here's the product" visual: a browser window showing a real
 * small-business site with the Zeva widget open on it. Static and clear (no 3D,
 * no parallax) — this is the Amazon-style "show the actual thing" anchor that
 * builds trust far better than abstract art. Decorative, so aria-hidden.
 */
export function ProductFrame() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[520px]">
      {/* browser window */}
      <div className="overflow-hidden rounded-r3 border border-border bg-surface shadow-panel">
        {/* title bar */}
        <div className="flex items-center gap-3 border-b border-border bg-panel px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex flex-1 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-faint">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            acmesalon.com
          </div>
        </div>

        {/* sample business site behind the widget */}
        <div className="relative h-[360px] bg-gradient-to-b from-panel to-surface sm:h-[400px]">
          {/* faux site nav */}
          <div className="flex items-center justify-between px-6 pt-5">
            <span className="text-[13px] font-[800] tracking-tight text-fg">
              Acme Salon
            </span>
            <div className="hidden gap-4 text-[11px] font-[600] text-faint sm:flex">
              <span>Services</span>
              <span>Prices</span>
              <span>Book</span>
            </div>
          </div>
          {/* faux site hero */}
          <div className="px-6 pt-8">
            <div className="h-2 w-24 rounded-full bg-accent/30" />
            <div className="mt-3 h-4 w-52 rounded-full bg-fg/15" />
            <div className="mt-2 h-4 w-40 rounded-full bg-fg/10" />
            <div className="mt-5 h-8 w-32 rounded-r1 bg-accent/15" />
          </div>
          <div className="absolute right-6 top-24 hidden h-28 w-40 rounded-r2 bg-fg/5 sm:block" />

          {/* the Zeva widget, open, bottom-right */}
          <div className="absolute bottom-4 right-4 w-[248px] overflow-hidden rounded-r2 border border-border bg-surface shadow-panel">
            <div className="flex items-center gap-2 border-b border-border bg-panel px-3 py-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong text-white">
                <SourceCheckIcon className="h-3.5 w-3.5" />
              </span>
              <div className="leading-tight">
                <p className="m-0 text-[11.5px] font-[750] text-fg">
                  Acme Salon Assistant
                </p>
                <p className="m-0 flex items-center gap-1 text-[9.5px] text-faint">
                  <span className="eyebrow-dot" /> online now
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 px-3 py-3">
              <div className="max-w-[82%] self-end rounded-r1 rounded-br-[4px] bg-accent px-2.5 py-1.5 text-[11px] font-medium text-white">
                Are you open on Sunday?
              </div>
              <div className="max-w-[92%] self-start rounded-r1 rounded-bl-[4px] border border-border bg-panel px-2.5 py-1.5 text-[11px] leading-[1.45] text-fg">
                Sundays are appointment-only, 11am–4pm.
              </div>
              <div className="flex w-fit items-center gap-1.5 self-start rounded-r1 border border-good/40 bg-good/10 px-2 py-1 text-[9.5px] font-[650] text-good">
                <SourceCheckIcon className="h-3 w-3" />
                hours.pdf · 98% match
              </div>
            </div>
            <div className="border-t border-border bg-panel px-3 py-2">
              <div className="flex items-center justify-between rounded-full border border-border bg-surface px-3 py-1.5">
                <span className="text-[10.5px] text-faint">Ask a question…</span>
                <span className="text-[10px] font-[700] text-accent">Ask</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* one small, honest floating proof — not clutter */}
      <div className="absolute -left-3 top-8 hidden rounded-r1 border border-good/40 bg-surface px-3 py-2 text-[11px] font-[700] text-good shadow-panel sm:block">
        + New lead captured
      </div>
    </div>
  );
}
