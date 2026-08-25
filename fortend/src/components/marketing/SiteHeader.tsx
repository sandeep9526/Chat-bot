"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const onScroll = () => {
      el.setAttribute("data-scrolled", String(window.scrollY > 8));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full bg-surface/85 backdrop-blur-md border-b border-border nav-shell font-sans"
    >
      <div className="max-w-[1240px] mx-auto px-6 sm:px-9 py-4 flex justify-between items-center">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 z-50">
          <OchreshiftLogo className="h-8 w-auto" />
        </Link>

        {/* Center: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-[500] text-muted hover:text-fg transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-6">
          <ThemeToggle />
          <Link href="/sign-in" className="text-sm font-[500] text-fg hover:text-muted transition-colors">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="bg-accent text-[#08111F] font-[600] text-sm rounded-md px-5 py-2.5 hover:bg-accent-strong transition-colors flex items-center gap-1.5"
          >
            Start free
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-fg z-50 p-2 -mr-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 h-[calc(100vh-64px)] bg-surface px-6 py-6 flex flex-col gap-4 md:hidden shadow-2xl z-[90] overflow-y-auto"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-[15px] font-[500] text-muted hover:text-fg transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <div className="flex justify-center py-2">
                <ThemeToggle />
              </div>
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="text-[15px] font-[500] text-center text-fg py-2"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className="bg-accent text-[#08111F] text-center font-[600] text-[15px] rounded-md px-6 py-3 transition-colors hover:bg-accent-strong flex items-center justify-center gap-1"
              >
                Start free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
