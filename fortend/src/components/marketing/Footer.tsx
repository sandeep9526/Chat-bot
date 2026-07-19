"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";
import { ArrowRightIcon, CheckIcon, ShieldMarkIcon } from "./icons";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Live demo", href: "/demo" },
      { label: "Studio", href: "/studio" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Sign up", href: "/sign-up" },
    ],
  },
];

type Status = "idle" | "loading" | "sent" | "error";

export function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  // Captures the email as a lead via the existing /api/lead endpoint (which
  // requires a name), tagged so it can be told apart from widget leads.
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: email.split("@")[0] || "Subscriber",
          email,
          botId: "marketing-updates",
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <footer className="relative overflow-hidden border-t border-border bg-panel pt-16">
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_2fr]">
        <div className="max-w-[320px]">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong text-white shadow-panel">
              <ShieldMarkIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[17px] font-[750] text-fg">Zeva</span>
          </Link>
          <p className="mt-4 text-[13.5px] leading-[1.65] text-muted">
            A grounded chat widget for small-business websites — answers from
            your documents, cited sources, leads captured. Built, hosted and
            maintained for you.
          </p>

          {/* Get-updates form — posts to /api/lead */}
          <form onSubmit={onSubmit} className="mt-6">
            <label
              htmlFor="footer-email"
              className="text-[11px] font-[750] uppercase tracking-[.14em] text-faint"
            >
              Get product updates
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-r1 border border-border bg-surface p-1 pl-3 focus-within:border-accent-ring">
              <input
                id="footer-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "sent" || status === "loading"}
                placeholder={
                  status === "sent"
                    ? "Thanks — we'll keep you posted"
                    : "you@business.com"
                }
                className="w-full bg-transparent text-[13.5px] text-fg outline-none placeholder:text-faint disabled:opacity-70"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                disabled={status === "loading" || status === "sent"}
                className="tap btn-shine grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-gradient-to-br from-accent to-accent-strong text-white disabled:opacity-70"
              >
                {status === "loading" ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : status === "sent" ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <ArrowRightIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {status === "error" && (
              <p className="mt-2 text-[12px] text-[#ef4444]">
                Something went wrong — please try again.
              </p>
            )}
          </form>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-[750] uppercase tracking-[.14em] text-faint">
                {col.title}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13.5px] text-muted transition-colors hover:text-fg"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="text-[11px] font-[750] uppercase tracking-[.14em] text-faint">
              Company
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <a
                  href="mailto:hello@zeva.app"
                  className="text-[13.5px] text-muted transition-colors hover:text-fg"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Container>

      {/* Subtle brand wordmark */}
      <div
        aria-hidden
        className="pointer-events-none mt-8 select-none px-6 text-center font-display font-[800] leading-none tracking-[-.04em] text-fg/[0.05]"
        style={{ fontSize: "clamp(72px, 18vw, 260px)" }}
      >
        Zeva
      </div>

      <div className="border-t border-border">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-[12px] text-faint">
            © {year} Zeva. Built for small businesses.
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11.5px] text-faint">
              Powered by Zeva.
            </span>
            <ThemeToggle />
          </div>
        </Container>
      </div>
    </footer>
  );
}
