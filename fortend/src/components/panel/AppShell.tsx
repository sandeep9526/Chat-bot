"use client";

import { useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";
import { MenuIcon, CloseIcon, SearchIcon } from "./panelIcons";
import { Lock } from "lucide-react";

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
  /** Small line under the "Ochreshift" wordmark, e.g. "Dashboard" / "Platform admin". */
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
  /** If true, locks all tabs except 'bots', 'settings', and 'help'. */
  sidebarLocked?: boolean;
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
  sidebarLocked,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => {
          if (!o) setSearchQuery("");
          return !o;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const allNavItems = groups.flatMap((g) => g.items);
  const filteredItems = allNavItems.filter((i) =>
    i.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const activeGroupLabel = groups.find((g) => g.items.some((i) => i.key === activeKey))?.label || brandLabel;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <OchreshiftLogo className="h-7 w-auto" />
        </div>
        <button
          type="button"
          className="tap grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-fg md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>


      <nav className="ae-stream flex-1 overflow-y-auto px-3 py-1 mt-2">
        {groups.map((group, gi) => (
          <div key={gi} className="mb-4">
            {group.label && (
              <div className="px-3 mb-1.5 text-[11px] font-[750] uppercase tracking-[0.12em] text-faint">
                {group.label}
              </div>
            )}
            <div className="flex flex-col gap-1">
              {(searchQuery ? group.items.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase())) : group.items).map((item) => {
                const active = item.key === activeKey;
                const isLocked = sidebarLocked && !["bots", "settings", "help"].includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    data-tour={item.tour}
                    disabled={isLocked}
                    title={isLocked ? "Create an agent first" : undefined}
                    onClick={() => {
                      if (!isLocked) {
                        onNavigate(item.key);
                        setMobileOpen(false);
                      }
                    }}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[13.5px] font-[600] transition-all duration-150",
                      active
                        ? "bg-accent/10 text-accent font-[750]"
                        : isLocked
                          ? "text-faint opacity-50 cursor-not-allowed [&.driver-active-element]:opacity-100 [&.driver-active-element]:text-fg"
                          : "text-muted hover:bg-panel/50 hover:text-fg cursor-pointer",
                    )}
                  >
                    <div className="flex flex-1 min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "shrink-0 transition-colors",
                          active ? "text-accent" : isLocked ? "text-inherit" : "text-faint group-hover:text-muted",
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate pr-2">{item.label}</span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {item.badge != null && item.badge !== 0 && !isLocked && (
                        <span className="flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                          {item.badge}
                        </span>
                      )}
                      {isLocked && <Lock className="h-3.5 w-3.5 opacity-50" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {sidebarFooter && <div className="border-t border-border/60 p-3 bg-panel/30">{sidebarFooter}</div>}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg text-fg selection:bg-accent/20">
      {/* Desktop sidebar (1280px+) */}
      <aside data-theme="auto" className="sticky top-0 hidden h-screen w-[240px] shrink-0 border-r border-border bg-bg xl:block">
        {sidebar}
      </aside>

      {/* Mobile & Tablet drawer (<1280px) */}
      {mobileOpen && (
        <div className="xl:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside data-theme="dark" className="fixed inset-y-0 left-0 z-50 w-[240px] border-r border-border bg-bg shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-bg to-bg">
        <header className="sticky top-0 z-30 flex h-[62px] items-center justify-between gap-3 border-b border-border/80 bg-surface/80 px-6 backdrop-blur-md max-xl:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="tap grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-fg xl:hidden hover:bg-panel"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 truncate">
              <span className="text-[12.5px] font-[650] text-muted">{activeGroupLabel}</span>
              <span className="text-[12.5px] text-faint">/</span>
              <h1 className="truncate text-[15px] font-[800] tracking-tight text-fg">{sectionTitle}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchOpen(true);
              }}
              className="relative hidden md:flex items-center text-left"
            >
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" />
              <div
                className="flex h-9 w-64 items-center rounded-[8px] border border-border/80 bg-panel pl-9 pr-3 text-[13px] text-muted transition-colors hover:border-accent"
              >
                Search anything...
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] text-faint font-mono">⌘K</kbd>
              </div>
            </button>
            {topbarRight}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div
            className="relative w-full max-w-xl mx-4 overflow-hidden rounded-[16px] border border-border bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b border-border/80 px-4">
              <SearchIcon className="h-5 w-5 text-muted" />
              <input
                autoFocus
                type="text"
                className="flex-1 bg-transparent px-4 py-4 text-[15px] font-[500] text-fg outline-none placeholder:text-muted"
                placeholder="Search panel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchOpen(false);
                  if (e.key === "Enter" && filteredItems.length > 0) {
                    setSearchOpen(false);
                    onNavigate(filteredItems[0].key);
                  }
                }}
              />
              <button onClick={() => setSearchOpen(false)} className="rounded p-1.5 text-muted hover:bg-panel hover:text-fg">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-2">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-[14px] text-muted font-[500]">No matching sections found.</div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.key}
                    className="flex w-full items-center gap-3 rounded-[10px] px-4 py-3 text-left text-[14px] font-[500] text-fg hover:bg-accent/10 hover:text-accent transition-colors"
                    onClick={() => {
                      setSearchOpen(false);
                      onNavigate(item.key);
                    }}
                  >
                    <span className="text-muted/70">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
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
