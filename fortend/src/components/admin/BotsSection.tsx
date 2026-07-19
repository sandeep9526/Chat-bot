"use client";

import { useState } from "react";
import Link from "next/link";
import { useDeleteBot, useSetBotPaused } from "@/hooks/useAdmin";
import { AdminApiError, type AdminBot } from "@/lib/adminApi";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/panel/AppShell";
import { BotFormModal, type BotInitial } from "./BotFormModal";
import {
  getPendingDesign,
  clearPendingDesign,
  stashBotDesign,
} from "@/lib/pendingDesign";
import type { ZevaConfig } from "@/lib/types";

// Module-scope so the "Make it yours" design only auto-opens the create modal
// once per page load — if the visitor cancels it we don't nag them again as
// they click around (the saved design still survives a full reload).
let autoOpenConsumed = false;

type ModalState = {
  mode: "create" | "edit";
  bot?: AdminBot;
  initial?: BotInitial;
  fromPending?: boolean;
};

/** Pre-filled create modal from a waiting "Make it yours" design, or null. */
function pendingModal(): ModalState | null {
  const pd = getPendingDesign();
  if (!pd) return null;
  return {
    mode: "create",
    fromPending: true,
    initial: {
      name: pd.config.name,
      accent: pd.config.accent,
      welcome: pd.config.welcome,
      suggestions: (pd.config.suggestions ?? []).filter((s) => s.trim()),
    },
  };
}

type Status = { label: string; cls: string };

function statusOf(bot: AdminBot): Status {
  if (bot.suspended) return { label: "Suspended", cls: "bg-red-500/12 text-red-500" };
  if (bot.paused) return { label: "Paused", cls: "bg-amber-500/15 text-amber-600" };
  if (bot.is_active !== false) return { label: "Active", cls: "bg-good/15 text-good" };
  return { label: "Inactive", cls: "bg-panel text-faint" };
}

interface BotsSectionProps {
  bots: AdminBot[];
  activeBotId: string;
  maxBots?: number;
  onSelect: (id: string) => void;
  onOpenInstall: (id: string) => void;
}

export function BotsSection({
  bots,
  activeBotId,
  maxBots,
  onSelect,
  onOpenInstall,
}: BotsSectionProps) {
  // Open the pre-filled "Make it yours" create modal as the initial state (not
  // via an effect) so it appears on first paint and isn't cancelled by
  // StrictMode's dev mount/unmount cycle.
  const [modal, setModal] = useState<ModalState | null>(() =>
    autoOpenConsumed ? null : pendingModal(),
  );
  const [confirmDelete, setConfirmDelete] = useState<AdminBot | null>(null);
  // Full design kept so we can stash it under the new bot's id (for a complete
  // Studio restore) once it's created.
  const [pendingConfig, setPendingConfig] = useState<ZevaConfig | null>(
    () => getPendingDesign()?.config ?? null,
  );

  const pauseMut = useSetBotPaused();
  const deleteMut = useDeleteBot();
  const [busyId, setBusyId] = useState<string>("");

  const atLimit = typeof maxBots === "number" && bots.length >= maxBots;

  const togglePause = async (bot: AdminBot) => {
    setBusyId(bot.bot_id);
    try {
      await pauseMut.mutateAsync({ botId: bot.bot_id, paused: !bot.paused });
    } finally {
      setBusyId("");
    }
  };

  const doDelete = async (bot: AdminBot) => {
    setBusyId(bot.bot_id);
    try {
      await deleteMut.mutateAsync(bot.bot_id);
      setConfirmDelete(null);
    } catch (err) {
      alert(err instanceof AdminApiError ? err.message : "Delete failed.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <SectionHeader
        title="Your bots"
        description={
          typeof maxBots === "number"
            ? `Manage every chatbot you run. ${bots.length} of ${maxBots} used on your plan.`
            : "Create, customize and manage every chatbot you run."
        }
        action={
          <button
            type="button"
            data-tour="new-bot"
            disabled={atLimit}
            onClick={() => setModal({ mode: "create" })}
            title={atLimit ? "You've reached your plan's bot limit — upgrade to add more." : undefined}
            className="inline-flex items-center gap-1.5 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-4 py-2 text-[13.5px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New bot
          </button>
        }
      />

      {atLimit && (
        <div className="mb-5 rounded-r2 border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-700">
          You&apos;re using all {maxBots} bot{maxBots === 1 ? "" : "s"} on your plan.{" "}
          <a href="mailto:contact@prepvia.com?subject=Upgrade%20my%20Zeva%20plan" className="font-[650] underline">
            Upgrade
          </a>{" "}
          to add more.
        </div>
      )}

      {bots.length === 0 ? (
        <div
          data-tour="new-bot-empty"
          className="rounded-r3 border border-dashed border-border bg-surface/50 p-10 text-center sm:p-14"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-r2 bg-gradient-to-br from-accent to-accent-strong text-white shadow-[0_10px_24px_-8px_var(--accent)]">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="8" width="16" height="12" rx="2" />
              <path d="M12 8V4M9 13h.01M15 13h.01M9 17h6" />
            </svg>
          </div>
          <h3 className="mt-5 text-[20px] font-[750] tracking-[-.01em] text-fg">
            Create your first bot
          </h3>
          <p className="mx-auto mt-2 max-w-[46ch] text-[14.5px] leading-relaxed text-muted">
            Give it a name, add your docs later, and copy one script tag. You&apos;ll
            have a live, grounded chatbot in about a minute.
          </p>
          <button
            type="button"
            onClick={() => setModal({ mode: "create" })}
            className="mt-6 inline-flex items-center gap-1.5 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-6 py-3 text-[14.5px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create a bot
          </button>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("zeva:start-tour"))}
              className="text-[13px] font-[600] text-muted underline-offset-2 hover:text-accent hover:underline"
            >
              or take a quick tour
            </button>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {bots.map((bot) => {
          const status = statusOf(bot);
          const isActive = bot.bot_id === activeBotId;
          const busy = busyId === bot.bot_id;
          return (
            <div
              key={bot.bot_id}
              data-tour="bot-card"
              className={cn(
                "flex flex-col rounded-r2 border bg-surface p-5 shadow-card transition-colors hover:shadow-card-hover",
                isActive ? "border-accent-ring ring-1 ring-accent-ring" : "border-border",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-r1 text-[13px] font-[750] text-white"
                    style={{ background: bot.accent }}
                  >
                    {bot.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[14.5px] font-[750] text-fg">{bot.name}</span>
                    </div>
                    <div className="truncate font-mono text-[11px] text-faint">{bot.bot_id}</div>
                  </div>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-[700]", status.cls)}>
                  {status.label}
                </span>
              </div>

              {isActive && (
                <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-[10.5px] font-[700] text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Currently selected
                </div>
              )}

              {/* actions */}
              <div className="mt-5 flex flex-1 flex-col justify-end gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(bot.bot_id)}
                    disabled={isActive}
                    className={cn(
                      "flex-1 rounded-r1 px-3 py-2 text-[12.5px] font-[650] transition-colors",
                      isActive
                        ? "cursor-default bg-panel text-faint"
                        : "border border-border bg-surface text-fg hover:border-accent hover:text-accent",
                    )}
                  >
                    {isActive ? "Selected" : "Open"}
                  </button>
                  <Link
                    href={`/studio?bot=${encodeURIComponent(bot.bot_id)}`}
                    className="flex-1 rounded-r1 border border-border bg-surface px-3 py-2 text-center text-[12.5px] font-[650] text-fg hover:border-accent hover:text-accent"
                  >
                    Studio
                  </Link>
                  <button
                    type="button"
                    onClick={() => onOpenInstall(bot.bot_id)}
                    className="flex-1 rounded-r1 border border-border bg-surface px-3 py-2 text-[12.5px] font-[650] text-fg hover:border-accent hover:text-accent"
                  >
                    Install
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={() => setModal({ mode: "edit", bot })}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-[600] text-muted hover:text-fg"
                  >
                    <PencilIcon /> Edit
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => togglePause(bot)}
                      disabled={busy || bot.suspended}
                      title={bot.suspended ? "Suspended by the platform — contact support." : undefined}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-[600] text-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {bot.paused ? <PlayIcon /> : <PauseIcon />}
                      {bot.paused ? "Resume" : "Pause"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(bot)}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-[600] text-muted hover:text-red-500"
                    >
                      <TrashIcon /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add-bot tile */}
        {!atLimit && (
          <button
            type="button"
            onClick={() => setModal({ mode: "create" })}
            className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-r2 border border-dashed border-border bg-surface/40 p-5 text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border border-current">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span className="text-[13px] font-[650]">New bot</span>
          </button>
        )}
      </div>
      )}

      {modal && (
        <BotFormModal
          mode={modal.mode}
          bot={modal.bot}
          initial={modal.initial}
          onClose={() => {
            // Cancelling the pre-filled modal: don't re-open it as they navigate
            // (a full reload still re-offers the saved design).
            if (modal.fromPending) autoOpenConsumed = true;
            setModal(null);
          }}
          onSaved={(id) => {
            setModal(null);
            if (modal.mode === "create") {
              // Carry the full "Make it yours" look onto the new bot so Studio
              // restores corners/font/launcher too, then retire the pending copy.
              if (pendingConfig) {
                stashBotDesign(id, pendingConfig, getPendingDesign()?.websiteUrl ?? "");
                clearPendingDesign();
                setPendingConfig(null);
                autoOpenConsumed = true;
              }
              onSelect(id);
            }
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDelete
          bot={confirmDelete}
          busy={busyId === confirmDelete.bot_id}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => doDelete(confirmDelete)}
        />
      )}
    </>
  );
}

function ConfirmDelete({
  bot,
  busy,
  onCancel,
  onConfirm,
}: {
  bot: AdminBot;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-[2px]" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[420px] rounded-r3 border border-border bg-surface p-6 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid h-11 w-11 place-items-center rounded-r2 bg-red-500/12 text-red-500">
          <TrashIcon className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-[17px] font-[750] text-fg">Delete “{bot.name}”?</h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
          This permanently removes the bot and <b>all its leads, conversations and
          documents</b>. This can&apos;t be undone.
        </p>
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-r1 border border-border bg-surface px-4 py-2.5 text-[13.5px] font-[650] text-fg hover:bg-panel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-r1 bg-red-500 px-5 py-2.5 text-[13.5px] font-[650] text-white transition-colors hover:bg-red-600 disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Delete bot"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- icons ---- */
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 5v14M15 5v14" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M7 5v14l11-7Z" />
    </svg>
  );
}
function TrashIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    </svg>
  );
}
