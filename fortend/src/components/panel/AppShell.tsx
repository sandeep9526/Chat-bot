"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ShieldMarkIcon } from "@/components/marketing/icons";
import { MenuIcon, CloseIcon } from "./panelIcons";

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  /** Optional trailing badge (e.g. a count). */
  badge?: ReactNode;
  /** Optional data-tour hook for the guided tour. */
  tour?: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface AppShellProps {
  /** Small line under the "Zeva" wordmark, e.g. "Dashboard" / "Platform admin". */
  brandLabel: string;
  groups: NavGroup[];
  activeKey: string;
  onNavigate: (key: string) => void;
  /** Title shown in the sticky top bar (usually the active section's label). */
  sectionTitle: string;
  /** Right-hand top-bar slot — bot switcher, theme toggle, account menu. */
  topbarRight?: ReactNode;
  /** Pinned bottom-of-sidebar slot — usually the signed-in user block. */
  sidebarFooter?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  brandLabel,
  groups,
  activeKey,
  onNavigate,
  sectionTitle,
  topbarRight,
  sidebarFooter,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-[18px]">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-r1 bg-gradient-to-br from-accent to-accent-strong text-white shadow-panel">
            <ShieldMarkIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-[750] tracking-[-.01em] text-fg">Zeva</div>
            <div className="text-[11px] font-[600] text-faint">{brandLabel}</div>
          </div>
        </div>
        <button
          type="button"
          className="tap grid h-8 w-8 place-items-center rounded-r1 text-muted hover:text-fg md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="ae-stream flex-1 overflow-y-auto px-3 pb-3">
        {groups.map((group, gi) => (
          <div key={gi} className="mb-4">
            {group.label && (
              <div className="px-3 pb-1.5 text-[10.5px] font-[700] uppercase tracking-[.14em] text-faint">
                {group.label}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = item.key === activeKey;
                return (
                  <button
                    key={item.key}
                    type="button"
                    data-tour={item.tour}
                    onClick={() => {
                      onNavigate(item.key);
                      setMobileOpen(false);
                    }}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-r1 px-3 py-2 text-left text-[13.5px] font-[600] transition-colors",
                      active
                        ? "bg-accent-soft text-accent"
                        : "text-muted hover:bg-panel hover:text-fg",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
                    )}
                    <span
                      className={cn(
                        "shrink-0 transition-colors",
                        active ? "text-accent" : "text-faint group-hover:text-muted",
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge != null && item.badge !== 0 && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-[700] tabular-nums",
                          active ? "bg-accent/15 text-accent" : "bg-panel text-faint",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {sidebarFooter && <div className="border-t border-border p-3">{sidebarFooter}</div>}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-border bg-surface md:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[248px] border-r border-border bg-surface shadow-panel">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between gap-3 border-b border-border bg-glass px-5 backdrop-blur max-md:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="tap grid h-9 w-9 shrink-0 place-items-center rounded-r1 border border-border text-fg md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <h1 className="truncate text-[16px] font-[750] tracking-[-.01em]">{sectionTitle}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">{topbarRight}</div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1080px] px-6 py-8 max-md:px-4 max-md:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------- Shared content-area primitives ---------------- */

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[22px] font-[750] tracking-[-.02em]">{title}</h2>
        {description && <p className="mt-1 text-[13.5px] text-muted">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-r2 border border-border bg-surface shadow-card",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
