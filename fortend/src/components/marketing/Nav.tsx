"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import {
  CloseIcon,
  MenuIcon,
  ShieldMarkIcon,
  BoltIcon,
  SparkleIcon,
  PaletteIcon,
  RocketIcon,
  LayoutIcon,
  ArrowRightIcon,
} from "./icons";

const NAV_ITEMS = [
  {
    href: "#how-it-works",
    label: "How it works",
    desc: "3-step bot setup guide",
    icon: BoltIcon,
  },
  {
    href: "#features",
    label: "Features",
    desc: "RAG AI & Lead Generation",
    icon: SparkleIcon,
  },
  {
    href: "/dashboard#appearance",
    label: "Studio",
    desc: "Customize live bot appearance",
    icon: PaletteIcon,
  },
  {
    href: "#pricing",
    label: "Pricing",
    desc: "Plans & free trial limits",
    icon: RocketIcon,
  },
  {
    href: "/demo",
    label: "Demo",
    desc: "Interactive bot playground",
    icon: LayoutIcon,
  },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const firstRun = useRef(true);

  // Move focus into the drawer on open, back to the toggle on close, so
  // keyboard/screen-reader users land somewhere sensible either way. Skips
  // the initial mount so page load never steals focus.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (open) drawerCloseRef.current?.focus();
    else menuBtnRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header
        data-scrolled={scrolled}
        className={`nav-shell sticky top-0 z-50 border-b ${
          scrolled
            ? "border-border bg-glass backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <div
          className={`mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 sm:px-9 ${
            scrolled ? "py-2.5" : "py-4"
          } transition-[padding] duration-300`}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={() => setOpen(false)}
          >
            <span className="grid h-9 w-9 place-items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong text-white shadow-[0_6px_16px_-6px_var(--accent)]">
              <ShieldMarkIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[17px] font-[750] tracking-[-.01em] text-fg">
              Zeva
            </span>
          </Link>

          <nav className="hidden items-center gap-1.5 lg:flex">
            {NAV_ITEMS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className="rounded-r1 px-3 py-2 text-[14px] font-[600] text-muted transition-colors hover:text-fg whitespace-nowrap"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-4 py-2 text-[14px] font-[650] text-white shadow-[0_6px_16px_-6px_var(--accent)] transition-transform hover:-translate-y-0.5 whitespace-nowrap"
            >
              Build your bot
            </Link>
          </div>

          <div className="flex items-center gap-2.5 lg:hidden">
            <ThemeToggle />
            <Link
              href="/sign-up"
              className="hidden sm:inline-flex items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-3.5 py-1.5 text-[13px] font-[650] text-white shadow-sm whitespace-nowrap"
            >
              Build bot
            </Link>
            <button
              ref={menuBtnRef}
              type="button"
              className="tap grid h-9.5 w-9.5 place-items-center rounded-xl border border-border bg-surface/80 text-fg hover:border-accent transition-colors"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Fullscreen Drawer Overlay (Independent z-[9999] outside header) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!open}
        inert={!open}
        style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
        className={`fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] h-[100dvh] w-full transition-all duration-300 ease-in-out lg:hidden flex flex-col ${
          open
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 -translate-y-4"
        }`}
      >
        {/* Header inside mobile menu */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-[var(--surface)] px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={() => setOpen(false)}
          >
            <span className="grid h-9 w-9 place-items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong text-white shadow-[0_6px_16px_-6px_var(--accent)]">
              <ShieldMarkIcon className="h-[18px] w-[18px]" />
            </span>
            <div className="flex flex-col">
              <span className="text-[17px] font-[800] tracking-tight text-fg">
                Zeva
              </span>
              <span className="text-[10px] font-semibold text-accent uppercase tracking-widest">
                Menu
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              ref={drawerCloseRef}
              type="button"
              onClick={() => setOpen(false)}
              className="tap grid h-10 w-10 place-items-center rounded-xl border border-border bg-[var(--panel)] text-fg hover:border-accent transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable menu body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between gap-6">
          {/* Navigation Links */}
          <nav className="flex flex-col gap-3">
            <p className="px-1 text-[11px] font-[800] uppercase tracking-widest text-muted">
              Navigation
            </p>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-[var(--surface)] p-4 transition-all hover:border-accent hover:shadow-md active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 border border-accent/20 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                      <Icon className="h-5.5 w-5.5" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[16px] font-[750] text-fg group-hover:text-accent transition-colors">
                        {item.label}
                      </span>
                      <span className="text-[12.5px] text-muted leading-tight">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4.5 w-4.5 text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent" />
                </Link>
              );
            })}
          </nav>

          {/* CTA Footer Card */}
          <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-lg space-y-3 shrink-0">
            <Link
              href="/sign-up"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-strong py-3.5 text-[15px] font-[750] text-white shadow-lg shadow-accent/20 transition-transform active:scale-[0.98]"
            >
              <span>Build your bot</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>

            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-[var(--panel)] py-3 text-[14px] font-[650] text-fg transition-colors hover:bg-surface"
            >
              Sign in to Dashboard
            </Link>

            <p className="flex items-center justify-center gap-1 text-center text-[11px] text-muted font-medium pt-1">
              <SparkleIcon className="h-3 w-3" /> 14-day free trial · Instant setup
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="group relative rounded-r1 px-3 py-2 text-[14px] font-[600] text-muted transition-colors hover:text-fg whitespace-nowrap"
    >
      {label}
      <span className="pointer-events-none absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-gradient-to-r from-accent to-good transition-transform duration-300 group-hover:scale-x-100" />
    </a>
  );
}
