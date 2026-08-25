import Link from "next/link";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";

const FOOTER_LINKS = {
  Product: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Use Cases", href: "#use-cases" },
  ],
  Company: [
    { label: "Contact", href: "mailto:hello@ochreshift.com" },
    { label: "Sign in", href: "/sign-in" },
    { label: "Start free", href: "/sign-up" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy", href: "/refund-policy" },
  ]
};

export function Footer() {
  return (
    <footer className="bg-bg border-t border-border py-20 px-6 sm:px-9 font-sans">
      <div className="max-w-[1240px] mx-auto flex flex-col lg:flex-row justify-between items-start gap-16">

        {/* Left Column */}
        <div className="flex flex-col items-start max-w-sm">
          <Link href="/" className="mb-8 block">
            <OchreshiftLogo className="h-[30px] w-auto" variant="default" />
          </Link>
          <p className="text-[15px] text-muted mb-8 leading-relaxed">
            OchreShift answers customer questions, detects buying intent, and captures qualified leads for your business 24/7.
          </p>
          <a
            href="mailto:hello@ochreshift.com"
            className="mb-8 inline-flex items-center gap-2 text-[14px] font-[500] text-muted hover:text-accent transition-colors"
          >
            hello@ochreshift.com
          </a>
          <p className="text-[14px] text-slate-500">
            © {new Date().getFullYear()} Ochreshift. All rights reserved.
          </p>
        </div>

        {/* Right Columns (Links Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-12 w-full lg:w-auto flex-1 lg:pl-16">
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="flex flex-col">
              <h4 className="text-[15px] font-[600] text-fg mb-6">
                {category}
              </h4>
              <ul className="flex flex-col gap-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-muted hover:text-[#FFB800] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </footer>
  );
}
