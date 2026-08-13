"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CloseIcon, MenuIcon, ArrowRightIcon } from "./icons";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";

const NAV_ITEMS = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#solutions", label: "Solutions" },
  { href: "#pricing", label: "Pricing" },
  { href: "/docs", label: "Resources" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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
        className={`intro sticky top-0 z-50 w-full border-b transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl border-[#E5E7EB] shadow-[0_1px_3px_rgba(8,17,31,0.06)]"
            : "bg-white/80 backdrop-blur-sm border-transparent"
        }`}
        style={{ "--d": "0ms" } as React.CSSProperties}
      >
        <div className="marketing-container flex h-[72px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
            <OchreshiftLogo className="h-[30px] w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative rounded-[8px] px-4 py-2 text-[15px] font-[500] text-[#475569] transition-colors duration-150 hover:text-[#08111F] whitespace-nowrap"
              >
                {link.label}
                <span className="pointer-events-none absolute inset-x-4 bottom-1 h-[1.5px] origin-left scale-x-0 bg-[#F5A900] transition-transform duration-200 group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-[15px] font-[500] text-[#08111F] transition-colors duration-150 hover:text-[#475569] whitespace-nowrap"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="btn-primary btn-shine h-[42px] px-6 text-[14px]"
            >
              Start free
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              href="/sign-up"
              className="inline-flex h-[36px] items-center justify-center rounded-[8px] bg-[#F5A900] px-4 text-[13px] font-[600] text-[#08111F]"
            >
              Start free
            </Link>
            <button
              ref={menuBtnRef}
              type="button"
              className="flex h-10 w-10 items-center justify-center text-[#08111F]"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={`fixed inset-0 top-[72px] z-40 bg-white transition-all duration-300 lg:hidden ${
          open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <div className="flex flex-col p-6 space-y-5">
          <nav className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-[10px] px-4 py-3.5 text-[16px] font-[600] text-[#08111F] transition-colors hover:bg-[#F8F8F6]"
              >
                {item.label}
                <ArrowRightIcon className="h-4 w-4 text-[#94a3b8]" />
              </Link>
            ))}
          </nav>
          <div className="pt-4 border-t border-[#E5E7EB] flex flex-col space-y-3">
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center py-3 text-[15px] font-[600] text-[#475569]"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-[10px] bg-[#F5A900] py-3.5 text-[15px] font-[600] text-[#08111F]"
            >
              Start free
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
