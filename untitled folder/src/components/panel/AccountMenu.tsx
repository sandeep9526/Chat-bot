"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ChevronDownIcon, LogoutIcon, SettingsIcon } from "./panelIcons";

function initials(nameOrEmail: string): string {
  const s = nameOrEmail.trim();
  if (!s) return "?";
  const parts = s.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

interface AccountMenuProps {
  name?: string | null;
  email: string;
  onLogout: () => void;
  /** Optional "open settings" action — routes to the Settings section. */
  onSettings?: () => void;
}

export function AccountMenu({ name, email, onLogout, onSettings }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const label = name || email;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="tap flex items-center gap-2 rounded-r1 border border-border bg-surface py-1 pl-1 pr-2 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-[11px] font-[700] text-white">
          {initials(label)}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-faint" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-r2 border border-border bg-surface shadow-panel"
        >
          <div className="border-b border-border px-4 py-3">
            <div className="truncate text-[13.5px] font-[700] text-fg">{name || "Signed in"}</div>
            <div className="truncate text-[12px] text-muted">{email}</div>
          </div>
          <div className="p-1.5">
            {onSettings && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSettings();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-r1 px-2.5 py-2 text-left text-[13px] font-[600] text-muted",
                  "hover:bg-panel hover:text-fg",
                )}
              >
                <SettingsIcon className="h-[17px] w-[17px] text-faint" />
                Settings
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-r1 px-2.5 py-2 text-left text-[13px] font-[600] text-red-500 hover:bg-red-500/10"
            >
              <LogoutIcon className="h-[17px] w-[17px]" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
