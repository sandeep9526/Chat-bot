import Link from "next/link";
import { ShieldMarkIcon } from "./icons";
import { WidgetThemeToggle } from "./WidgetThemeToggle";

/**
 * Lightweight brand header for sub-pages (Studio, Demo). Simpler than the
 * marketing Nav — no scroll effects — just consistent branding, a dark/light
 * toggle (which drives the widget's `surface`, keeping page + preview in sync),
 * a way home, and the primary CTA.
 */
export function SiteHeader({ cta = true }: { cta?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-glass backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 py-3.5 sm:px-9">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong text-white shadow-[0_6px_16px_-6px_var(--accent)]">
            <ShieldMarkIcon className="h-[17px] w-[17px]" />
          </span>
          <span className="text-[16px] font-[750] tracking-[-.01em] text-fg">
            Zeva
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { href: "/#how-it-works", label: "How it works" },
            { href: "/#features", label: "Features" },
            { href: "/studio", label: "Studio" },
            { href: "/demo", label: "Demo" },
            { href: "/#pricing", label: "Pricing" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-r1 px-3 py-2 text-[14px] font-[600] text-muted transition-colors hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <WidgetThemeToggle />
          <Link
            href="/sign-in"
            className="hidden rounded-r1 px-3 py-2 text-[14px] font-[600] text-muted transition-colors hover:text-fg sm:block"
          >
            Sign in
          </Link>
          {cta && (
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-4 py-2 text-[14px] font-[650] text-white shadow-[0_6px_16px_-6px_var(--accent)] transition-transform hover:-translate-y-0.5"
            >
              Build your bot
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
