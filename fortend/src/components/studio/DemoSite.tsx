"use client";

import { useEffect, useRef, useState } from "react";

interface DemoSiteProps {
  websiteUrl?: string;
}

/**
 * Turn whatever the user typed into a loadable absolute URL. People commonly
 * type "prepvia.com" or "www.prepvia.com" with no scheme — without this the
 * <iframe src> resolves relative to localhost (…/www.prepvia.com) and shows a
 * blank 404, which looks like "the preview is broken".
 */
function normalizeUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    return new URL(withScheme).href;
  } catch {
    return null;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Default mock UI shown behind the widget in the studio preview.
 * When a website URL is entered, tries to show that site in an iframe.
 */
export function DemoSite({ websiteUrl }: DemoSiteProps) {
  if (websiteUrl && websiteUrl.trim()) {
    // key on the URL so a new address remounts with fresh "loading" state,
    // instead of resetting state via a synchronous setState in an effect.
    return <SitePreview key={websiteUrl.trim()} raw={websiteUrl} />;
  }
  return <MockSite />;
}

function SitePreview({ raw }: { raw: string }) {
  const url = normalizeUrl(raw);
  // "loading" until the frame reports load; "blocked" if it never does (the
  // common case for sites that send X-Frame-Options / frame-ancestors — those
  // can't be detected cross-origin, so we fall back on a timeout heuristic).
  const [status, setStatus] = useState<"loading" | "loaded" | "blocked">("loading");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!url) return;
    // Flip to "blocked" only if the frame never reports load — the common
    // outcome for sites that send X-Frame-Options / frame-ancestors, which
    // can't be detected cross-origin. setState here is inside a timer callback
    // (async), not synchronous in the effect body.
    timer.current = setTimeout(() => {
      setStatus((s) => (s === "loading" ? "blocked" : s));
    }, 4500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [url]);

  if (!url) {
    return (
      <Notice
        title="That doesn't look like a web address"
        body="Enter a full site URL like https://your-site.com to preview it here."
      />
    );
  }

  return (
    <div className="absolute inset-0 top-[49px] bg-white">
      <iframe
        src={url}
        className="h-full w-full border-0"
        title="Website preview"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={() => setStatus("loaded")}
      />

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white">
          <div className="flex items-center gap-2.5 text-[13px] text-muted">
            <span className="h-2.5 w-2.5 animate-blink rounded-full bg-accent" />
            Loading {hostOf(url)}…
          </div>
        </div>
      )}

      {status === "blocked" && (
        <Notice
          title={`${hostOf(url)} can't be shown in the preview`}
          body="Many live sites block being embedded in a frame for security (an X-Frame-Options / CSP setting). This is normal — it does NOT affect your actual chat widget, which runs fine once the snippet is installed on the real site."
          url={url}
        />
      )}
    </div>
  );
}

/** Full-bleed overlay message for the URL-preview error/blocked states. */
function Notice({ title, body, url }: { title: string; body: string; url?: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-panel px-6 text-center">
      <div className="max-w-[340px]">
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-r2 border border-border bg-surface text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <path d="M3 9h18" />
            <path d="M8 21h8" />
          </svg>
        </div>
        <b className="text-[14px] font-[750] text-fg">{title}</b>
        <p className="mx-auto mt-1.5 text-[12.5px] leading-relaxed text-muted">{body}</p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-r1 border border-border bg-surface px-3 py-2 text-[12.5px] font-[650] text-fg hover:border-accent"
          >
            Open {hostOf(url)} in a new tab ↗
          </a>
        )}
      </div>
    </div>
  );
}

/** The original Acme Salon mock page shown when no URL is entered. */
function MockSite() {
  return (
    <div className="px-6 py-12 sm:px-12">
      <nav className="mb-12 flex items-center justify-between sm:mb-[54px]">
        <div className="text-base font-[750]">
          Acme<span className="text-accent">Salon</span>
        </div>
        <div className="flex gap-5 text-[13.5px] text-muted max-sm:hidden">
          <span className="font-[650] text-fg">Home</span>
          <span>Services</span>
          <span>Pricing</span>
          <span>Book</span>
        </div>
      </nav>
      <div className="max-w-[30ch]">
        <span className="text-[11.5px] font-[750] uppercase tracking-[.16em] text-accent">
          Est. 2019 · Mohali
        </span>
        <h2 className="mb-0 mt-3 text-[clamp(28px,5vw,46px)] font-bold leading-none tracking-[-.03em]">
          Look good. Feel great.
        </h2>
        <p className="mb-0 mt-4 max-w-[42ch] text-[15px] leading-[1.6] text-muted">
          Cuts, color, and care from stylists who actually listen. Ask our
          assistant anything.
        </p>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="mt-[22px] inline-block rounded-[12px] bg-gradient-to-br from-accent to-accent-strong px-5 py-[11px] text-[14px] font-[650] text-white no-underline"
        >
          Book an appointment
        </a>
      </div>
    </div>
  );
}
