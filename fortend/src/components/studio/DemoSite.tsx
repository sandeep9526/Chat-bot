"use client";

import { useEffect, useRef, useState } from "react";
import { useZevaStore } from "@/stores/zevaStore";
import { INDUSTRY_TEMPLATES } from "@/lib/templates";

interface DemoSiteProps {
  websiteUrl?: string;
  onFallbackStatusChange?: (isFallback: boolean) => void;
}

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

const INDUSTRY_DETAILS: Record<
  string,
  {
    badge: string;
    tagline: string;
    sub: string;
    primaryCta: string;
    secondaryCta: string;
    cards: { title: string; desc: string; icon: string }[];
  }
> = {
  salon: {
    badge: "✨ Luxury Beauty & Hair Studio",
    tagline: "Haircuts, Facials & Organic Spa Packages",
    sub: "Book precision haircuts, balayage highlights, organic glow facials, and relaxing massages online.",
    primaryCta: "Book Salon Appointment",
    secondaryCta: "View Haircut Prices ($30+)",
    cards: [
      { icon: "💇‍♀️", title: "Hair Styling & Colors", desc: "Women's haircut $45, Balayage $120, Precision men's cuts." },
      { icon: "💆‍♀️", title: "Organic Facials & Spa", desc: "60-min organic glow facial ($65) & full body massage ($85)." },
      { icon: "💅", title: "Manicure & Pedicure", desc: "Express combo ($50) & bridal hair/makeup packages." },
    ],
  },
  prepvia: {
    badge: "📦 Guaranteed 35-Hour Turnaround SLA",
    tagline: "Amazon FBA Prep & Order Fulfillment Center",
    sub: "Automated barcode labeling, polybagging, bundling, and real-time inventory API tracking.",
    primaryCta: "Get Custom Prep Quote",
    secondaryCta: "View Prep Fees ($0.30/unit)",
    cards: [
      { icon: "🏷️", title: "Item Labeling & Polybag", desc: "Barcode labeling ($0.30/unit) & polybagging ($0.45/unit)." },
      { icon: "📦", title: "Multi-Pack Bundling", desc: "2-pack & multi-pack bundling ($0.65) with pallet prep." },
      { icon: "⚡", title: "35-Hour Speed SLA", desc: "Same-day intake with real-time seller API inventory sync." },
    ],
  },
  clinic: {
    badge: "🩺 24/7 OPD & Emergency Family Healthcare",
    tagline: "Doctor Consultations, Dental & Lab Services",
    sub: "General physician consultations, pediatric care, cardiology, and full-body diagnostic lab tests.",
    primaryCta: "Book Doctor Appointment",
    secondaryCta: "Check OPD Timings",
    cards: [
      { icon: "👨‍⚕️", title: "General Physician OPD", desc: "OPD consultation ($50) Mon-Sat 9am-1pm & 4pm-8pm." },
      { icon: "🦷", title: "Dental & Cleaning", desc: "Dental checkup & cleaning ($80) with specialist care." },
      { icon: "🩸", title: "Full Diagnostic Labs", desc: "Blood test panel ($95) with 24/7 emergency walk-ins." },
    ],
  },
  realestate: {
    badge: "🏠 Verified Luxury Properties & Gated Villas",
    tagline: "Luxury 2BHK Apartments & Gated Villas",
    sub: "Browse premium residential towers from $280k & independent 4BHK villas from $650k with 6.5% home loan rates.",
    primaryCta: "Schedule Site Visit",
    secondaryCta: "Browse Property Listings",
    cards: [
      { icon: "🏢", title: "Skyline Apartments", desc: "2BHK luxury apartments starting at $280,000 (1,150 sq ft)." },
      { icon: "🏡", title: "The Grand Villas", desc: "4BHK independent gated villas starting at $650,000." },
      { icon: "📜", title: "6.5% Home Loans", desc: "Pre-approved home loans with free guided site transport." },
    ],
  },
  ecommerce: {
    badge: "🛍️ Free Express Shipping on Orders Over $50",
    tagline: "Trending Apparel, Footwear & Accessories",
    sub: "Shop trendsetting fashion, organic denim, and lifestyle accessories with 7-day free returns.",
    primaryCta: "Shop New Collection",
    secondaryCta: "Track My Order",
    cards: [
      { icon: "🚚", title: "Free Express Shipping", desc: "Free delivery over $50 with 3-5 day standard shipping." },
      { icon: "🔄", title: "7-Day Free Returns", desc: "100% hassle-free returns with free pickup." },
      { icon: "💳", title: "Flexible Payment", desc: "Cards, PayPal, Cash on Delivery & Buy-Now-Pay-Later." },
    ],
  },
  restaurant: {
    badge: "🍕 Authentic Wood-Fired Italian Trattoria",
    tagline: "Handmade Pastas, Wood-Fired Pizza & Gelato",
    sub: "Savor DOC Margherita pizzas, truffle mushroom fettuccine, tiramisu, and fine Italian wines.",
    primaryCta: "Reserve Table Tonight",
    secondaryCta: "View Gourmet Menu",
    cards: [
      { icon: "🍕", title: "Wood-Fired Pizza", desc: "Margherita DOC ($15) & artisan stone-baked pizzas." },
      { icon: "🍝", title: "Fresh Handmade Pasta", desc: "Truffle Mushroom Fettuccine ($18) & vegan options." },
      { icon: "🍷", title: "Dining & Delivery", desc: "Open 11:30am–11pm daily with free delivery over $35." },
    ],
  },
  techsaas: {
    badge: "🚀 14-Day Full Access Free Trial",
    tagline: "Cloud Automation & Developer API Platform",
    sub: "Automate complex data workflows, schedule backups, and integrate REST APIs with zero code.",
    primaryCta: "Start 14-Day Free Trial",
    secondaryCta: "View SaaS Plans ($29/mo)",
    cards: [
      { icon: "⚡", title: "Workflow Automation", desc: "Build automated pipelines with 1-click cloud sync." },
      { icon: "🔒", title: "Enterprise Security", desc: "1 TB storage, dedicated SSO & 99.9% SLA uptime." },
      { icon: "🔌", title: "Developer APIs", desc: "Connect webhooks, databases & custom developer tools." },
    ],
  },
  education: {
    badge: "🎓 100% Career Placement Support",
    tagline: "Full-Stack Web Dev, Data Science & AI Bootcamps",
    sub: "Master full-stack coding, machine learning, and AI agent engineering with 1-on-1 expert mentorship.",
    primaryCta: "Explore Bootcamp Courses",
    secondaryCta: "Talk to Academic Advisor",
    cards: [
      { icon: "💻", title: "Full-Stack Web Dev", desc: "12-week intensive coding bootcamp ($1,200)." },
      { icon: "📊", title: "Data Science & ML", desc: "16-week comprehensive machine learning track ($1,500)." },
      { icon: "🤖", title: "AI Engineering", desc: "8-week LLM & AI agent engineering bootcamp ($950)." },
    ],
  },
};

function getMatchedDetails(name: string, url: string) {
  const n = (name || "").toLowerCase().trim();
  const u = (url || "").toLowerCase().trim();

  const tmpl = INDUSTRY_TEMPLATES.find(
    (t) =>
      (n && t.botName.toLowerCase() === n) ||
      (n && t.id.toLowerCase() === n) ||
      (n && t.name.toLowerCase() === n) ||
      (u && u.length > 4 && (t.websiteUrl.toLowerCase().includes(u) || u.includes(t.websiteUrl.toLowerCase().replace(/^https?:\/\//, "")))) ||
      (n && n.length > 2 && n.includes(t.name.toLowerCase()))
  );

  if (tmpl && INDUSTRY_DETAILS[tmpl.id]) {
    return INDUSTRY_DETAILS[tmpl.id];
  }

  if (n.includes("salon") || n.includes("spa") || n.includes("hair") || n.includes("beauty") || n.includes("glow") || (u && u.includes("salon"))) {
    return INDUSTRY_DETAILS.salon;
  }
  if (n.includes("prep") || n.includes("fba") || n.includes("logistics") || n.includes("smartprep") || (u && u.includes("prep"))) {
    return INDUSTRY_DETAILS.prepvia;
  }
  if (n.includes("clinic") || n.includes("health") || n.includes("doctor") || n.includes("wellness") || (u && u.includes("clinic"))) {
    return INDUSTRY_DETAILS.clinic;
  }
  if (n.includes("realty") || n.includes("estate") || n.includes("property") || n.includes("prime") || (u && u.includes("realty"))) {
    return INDUSTRY_DETAILS.realestate;
  }
  if (n.includes("style") || n.includes("fashion") || n.includes("shop") || n.includes("urban") || n.includes("e-commerce") || n.includes("ecommerce") || (u && u.includes("style")) || (u && u.includes("urban"))) {
    return INDUSTRY_DETAILS.ecommerce;
  }
  if (n.includes("bella") || n.includes("italia") || n.includes("pizza") || n.includes("restaurant") || (u && u.includes("bella"))) {
    return INDUSTRY_DETAILS.restaurant;
  }
  if (n.includes("cloud") || n.includes("saas") || n.includes("flow") || (u && u.includes("cloud"))) {
    return INDUSTRY_DETAILS.techsaas;
  }
  if (n.includes("peak") || n.includes("academy") || n.includes("bootcamp") || n.includes("coding") || (u && u.includes("academy"))) {
    return INDUSTRY_DETAILS.education;
  }

  return {
    badge: "⚡ 24/7 AI-Powered Official Website",
    tagline: `Welcome to ${name || "Official Portal"}`,
    sub: "Our AI assistant is active on this page. Ask anything about services, pricing, hours, or support.",
    primaryCta: "Explore Official Services",
    secondaryCta: "Contact Support Team",
    cards: [
      { icon: "🤖", title: "24/7 AI Support", desc: "Instant responses grounded strictly in site content." },
      { icon: "🎯", title: "Lead Generation", desc: "Captures qualified visitor contacts automatically." },
      { icon: "⚡", title: "Real-time Sync", desc: "Pushes warm leads to Google Sheets & CRM." },
    ],
  };
}

export function DemoSite({ websiteUrl, onFallbackStatusChange }: DemoSiteProps) {
  if (websiteUrl && websiteUrl.trim()) {
    return <SitePreview key={websiteUrl.trim()} raw={websiteUrl} onFallbackStatusChange={onFallbackStatusChange} />;
  }
  
  useEffect(() => {
    onFallbackStatusChange?.(true);
  }, [onFallbackStatusChange]);

  return (
    <div className="absolute inset-0 top-[49px] bg-panel z-10 overflow-hidden">
      <iframe
        src="https://ochreshift.in"
        className="h-full w-full border-0 pointer-events-none opacity-80"
        title="Fallback preview"
      />
    </div>
  );
}

function SitePreview({ raw, onFallbackStatusChange }: { raw: string, onFallbackStatusChange?: (isFallback: boolean) => void }) {
  const url = normalizeUrl(raw);
  const [status, setStatus] = useState<"loading" | "loaded" | "blocked">("loading");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!url) return;
    let mounted = true;

    // Check backend first to see if it allows framing
    fetch(`/api/check-frame?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
        if (!mounted) return;
        if (data.canFrame === false) {
          setStatus("blocked");
        }
      })
      .catch(() => {
        if (mounted) setStatus("blocked");
      });

    // Fallback timeout in case loading takes too long
    timer.current = setTimeout(() => {
      setStatus((s) => (s === "loading" ? "blocked" : s));
    }, 4500);

    return () => {
      mounted = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [url]);

  useEffect(() => {
    onFallbackStatusChange?.(!url || status === "blocked");
  }, [url, status, onFallbackStatusChange]);

  if (!url) {
    return (
      <div className="absolute inset-0 top-[49px] bg-panel z-10 overflow-hidden">
        <iframe
          src="https://ochreshift.in"
          className="h-full w-full border-0 pointer-events-none opacity-80"
          title="Fallback preview"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 top-[49px] bg-panel z-10 overflow-hidden">
      <iframe
        src={url}
        className="h-full w-full border-0 pointer-events-none"
        title="Website preview"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={() => setStatus(s => s === "loading" ? "loaded" : s)}
      />

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-panel z-20">
          <div className="flex items-center gap-2.5 text-[13px] text-muted font-[500]">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
            Loading {hostOf(url)}…
          </div>
        </div>
      )}

      {status === "blocked" && (
        <div className="absolute inset-0 z-20 overflow-hidden bg-bg">
          <iframe
            src="https://ochreshift.in"
            className="h-full w-full border-0 pointer-events-none opacity-80"
            title="Fallback preview"
          />
        </div>
      )}
    </div>
  );
}

function CustomSiteMock({ url }: { url: string }) {
  const name = useZevaStore((s) => s.config.name);
  const logo = useZevaStore((s) => s.config.logo);
  const host = hostOf(url);
  const cleanHost = host.replace(/^www\./i, "");
  const brandTitle = name || cleanHost.split(".")[0];
  const details = getMatchedDetails(name, url);

  return (
    <div className="absolute inset-0 bg-panel overflow-y-auto px-6 py-10 sm:px-12">
      <nav className="mb-8 flex items-center justify-between border-b border-border/60 pb-4 gap-4">
        <div className="flex items-center gap-2.5 min-w-0 max-w-[220px] sm:max-w-[320px]">
          {logo ? (
            logo.startsWith("http") || logo.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="w-8 h-8 rounded-r1 object-contain p-1 bg-surface border border-border shadow-sm shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-r1 bg-accent/20 border border-accent/30 grid place-items-center text-lg shadow-sm shrink-0">
                <span>{logo}</span>
              </div>
            )
          ) : (
            <div className="w-8 h-8 rounded-r1 bg-gradient-to-br from-accent to-accent-strong grid place-items-center text-white font-[800] text-sm shadow-sm shrink-0">
              {brandTitle[0]}
            </div>
          )}
          <span className="text-[15px] font-[800] text-fg tracking-tight truncate" title={brandTitle}>
            {brandTitle}
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-5 text-[13px] text-muted max-sm:hidden font-[600] shrink-0">
          <span className="text-fg font-[700]">Home</span>
          <span>Services</span>
          <span>Pricing</span>
          <span>About Us</span>
          <span>Contact</span>
        </div>
      </nav>

      <div className="max-w-[580px] mt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-good/10 text-good text-[12px] font-[700] mb-3 border border-good/20">
          <span className="w-2 h-2 rounded-full bg-good animate-pulse" />
          {details.badge}
        </div>

        <h2 className="text-[clamp(24px,3.8vw,34px)] font-[800] text-fg leading-tight tracking-[-.02em] m-0">
          {details.tagline}
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          {details.sub}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-r1 bg-accent px-4 py-2.5 text-[13px] font-[650] text-white hover:bg-accent-strong transition-all shadow-sm"
          >
            {details.primaryCta} ↗
          </a>
          <span className="text-[12.5px] font-[650] text-muted cursor-pointer hover:text-fg">
            {details.secondaryCta}
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 min-[540px]:grid-cols-3 gap-3 sm:gap-4">
        {details.cards.map((card) => (
          <div key={card.title} className="p-4 rounded-r2 border border-border bg-surface shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{card.icon}</span>
              <b className="text-[13px] font-[700] text-fg block">{card.title}</b>
            </div>
            <span className="text-[12px] text-muted mt-1 block leading-snug">{card.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockSite() {
  const name = useZevaStore((s) => s.config.name);
  const logo = useZevaStore((s) => s.config.logo);
  const websiteUrl = useZevaStore((s) => s.websiteUrl);
  const brandTitle = name || "Zeva AI";
  const details = getMatchedDetails(name, websiteUrl || "");

  return (
    <div className="px-6 py-10 sm:px-12 absolute inset-0 top-[49px] bg-panel z-10 overflow-y-auto">
      <nav className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0 max-w-[220px] sm:max-w-[320px]">
          {logo ? (
            logo.startsWith("http") || logo.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="w-7 h-7 shrink-0 rounded-r1 object-contain p-0.5 bg-surface border border-border" />
            ) : (
              <span className="text-lg shrink-0">{logo}</span>
            )
          ) : (
            <div className="w-7 h-7 rounded-r1 bg-gradient-to-br from-accent to-accent-strong grid place-items-center text-white font-[800] text-xs shadow-sm shrink-0">
              {brandTitle[0]}
            </div>
          )}
          <div className="text-base font-[750] text-fg truncate" title={brandTitle}>
            {brandTitle}
          </div>
        </div>
        <div className="flex gap-4 sm:gap-5 text-[13.5px] text-muted max-sm:hidden shrink-0">
          <span className="font-[650] text-fg">Home</span>
          <span>Services</span>
          <span>Pricing</span>
          <span>About Us</span>
          <span>Contact</span>
        </div>
      </nav>

      <div className="max-w-[580px] mt-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-[12px] font-[750] mb-3 border border-accent/20">
          {details.badge}
        </span>
        <h2 className="mb-0 mt-2 text-[clamp(26px,4.5vw,40px)] font-[800] leading-tight tracking-[-.03em] text-fg">
          {details.tagline}
        </h2>
        <p className="mb-0 mt-3 text-[14.5px] leading-[1.6] text-muted">
          {details.sub}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-5 py-2.5 text-[13.5px] font-[650] text-white shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
          >
            {details.primaryCta}
          </button>
          <span className="text-[13px] font-[650] text-muted cursor-pointer hover:text-fg">
            {details.secondaryCta}
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 min-[540px]:grid-cols-3 gap-3 sm:gap-4">
          {details.cards.map((card) => (
            <div key={card.title} className="p-4 rounded-r2 border border-border bg-surface shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{card.icon}</span>
                <b className="text-[13px] font-[700] text-fg block">{card.title}</b>
              </div>
              <span className="text-[12px] text-muted mt-1 block leading-snug">{card.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
