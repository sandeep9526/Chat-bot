import Link from "next/link";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Integrations", href: "#integrations" },
    { label: "API", href: "/docs/api" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Blog", href: "/blog" },
    { label: "Help Center", href: "/help" },
    { label: "Changelog", href: "/changelog" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy", href: "/refund-policy" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#E5E7EB] pt-16 pb-10">
      <div className="marketing-container">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <OchreshiftLogo className="h-[30px] w-auto" />
            </Link>
            <p className="mt-5 max-w-[300px] text-[15px] leading-[1.65] text-[#475569]">
              The intelligent answer engine for modern businesses. Build, deploy and scale AI-powered applications with developer-first tools.
            </p>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-3">
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-[13px] font-[600] text-[#08111F] mb-5 uppercase tracking-wider">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-[15px] text-[#475569] transition-colors duration-150 hover:text-[#F5A900]">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[14px] text-[#64748B]">
            © {new Date().getFullYear()} Ochreshift. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-[14px] text-[#64748B]">
              <span className="h-2 w-2 rounded-full bg-[#16A34A]" /> Systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
