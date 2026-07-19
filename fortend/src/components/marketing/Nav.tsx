"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { CloseIcon, MenuIcon, ShieldMarkIcon } from "./icons";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "/studio", label: "Studio" },
  { href: "#pricing", label: "Pricing" },
  { href: "/demo", label: "Demo" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
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

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="rounded-r1 px-3 py-2 text-[14px] font-[600] text-muted transition-colors hover:text-fg"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-4 py-2 text-[14px] font-[650] text-white shadow-[0_6px_16px_-6px_var(--accent)] transition-transform hover:-translate-y-0.5"
          >
            Build your bot
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="tap grid h-9 w-9 place-items-center rounded-r1 border border-border bg-surface/60 text-fg"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile full-screen slide-in menu */}
      <div
        className={`fixed inset-0 top-0 z-40 origin-top bg-bg/95 backdrop-blur-xl transition-all duration-[400ms] md:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <nav className="flex h-full flex-col justify-center gap-2 px-8">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-display text-[30px] font-[750] tracking-[-.02em] text-fg transition-all duration-500"
              style={{
                transform: open ? "translateY(0)" : "translateY(20px)",
                opacity: open ? 1 : 0,
                transitionDelay: `${open ? 120 + i * 60 : 0}ms`,
              }}
            >
              {link.label}
            </a>
          ))}
          <div
            className="mt-8 flex flex-col gap-3 transition-all duration-500"
            style={{
              transform: open ? "translateY(0)" : "translateY(20px)",
              opacity: open ? 1 : 0,
              transitionDelay: `${open ? 120 + NAV_LINKS.length * 60 : 0}ms`,
            }}
          >
            <Link
              href="/sign-up"
              onClick={() => setOpen(false)}
              className="inline-flex w-fit items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-6 py-3 text-[16px] font-[650] text-white shadow-panel"
            >
              Build your bot
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="text-[15px] font-[600] text-muted"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="group relative rounded-r1 px-3 py-2 text-[14px] font-[600] text-muted transition-colors hover:text-fg"
    >
      {label}
      <span className="pointer-events-none absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-gradient-to-r from-accent to-good transition-transform duration-300 group-hover:scale-x-100" />
    </a>
  );
}
