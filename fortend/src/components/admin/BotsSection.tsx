"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil as PencilIcon, Pause as PauseIcon, Play as PlayIcon, Trash2 as TrashIcon, Plus, Bot as BotIcon } from "lucide-react";
import { useDeleteBot, useSetBotPaused } from "@/hooks/useAdmin";
import { AdminApiError, type AdminBot } from "@/lib/adminApi";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/panel/AppShell";
import { BotFormModal, type BotInitial } from "./BotFormModal";
import { ConfirmDialog } from "./ConfirmDialog";
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
  if (bot.suspended) return { label: "Suspended", cls: "bg-bad/12 text-bad" };
  if (bot.paused) return { label: "Paused", cls: "bg-warn/15 text-warn" };
  if (bot.is_active !== false) return { label: "Active", cls: "bg-good/15 text-good" };
  return { label: "Inactive", cls: "bg-panel text-faint" };
}

interface BotsSectionProps {
  bots: AdminBot[];
  activeBotId: string;
  maxBots?: number;
  onSelect: (id: string) => void;
  onOpenInstall: (id: string) => void;
  onOpenStudio?: (id: string) => void;
}

export function BotsSection({
  bots,
  activeBotId,
  maxBots,
  onSelect,
  onOpenInstall,
  onOpenStudio,
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
            <Plus className="h-4 w-4" />
            New bot
          </button>
        }
      />

      {atLimit && (
        <div className="mb-5 rounded-r2 border border-warn/30 bg-warn/10 px-4 py-3 text-[13px] text-warn">
          You&apos;re using all {maxBots} bot{maxBots === 1 ? "" : "s"} on your plan.{" "}
          <a href="mailto:support@zeva.app?subject=Upgrade%20my%20Zeva%20plan" className="font-[650] underline">
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
            <BotIcon className="h-7 w-7" />
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
            <Plus className="h-4 w-4" />
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {bots.map((bot) => {
          const status = statusOf(bot);
          const isActive = bot.bot_id === activeBotId;
          const busy = busyId === bot.bot_id;
          return (
            <div
              key={bot.bot_id}
              data-tour="bot-card"
              className={cn(
                "group flex flex-col rounded-r2 border bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-[3px] hover:shadow-card-hover",
                isActive
                  ? "border-accent/40 ring-2 ring-accent/20 bg-gradient-to-b from-accent/5 via-surface to-surface"
                  : "border-border/80 hover:border-accent/30",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-r1 text-[15px] font-[800] text-white shadow-md shadow-accent/20 transition-transform group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${bot.accent}, var(--accent-strong))` }}
                  >
                    {bot.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-[800] tracking-tight text-fg">{bot.name}</span>
                    </div>
                    <div className="truncate font-mono text-[11px] font-[600] text-faint">ID: {bot.bot_id}</div>
                  </div>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-[750]", status.cls)}>
                  {status.label}
                </span>
              </div>

              {isActive && (
                <div className="mt-3.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/15 px-3 py-0.5 text-[10.5px] font-[750] text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Selected
                </div>
              )}

              {/* actions */}
              <div className="mt-6 flex flex-1 flex-col justify-end gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(bot.bot_id)}
                    disabled={isActive}
                    className={cn(
                      "flex-1 rounded-r1 px-3 py-2 text-[12.5px] font-[700] transition-all cursor-pointer",
                      isActive
                        ? "cursor-default bg-panel text-faint border border-border/50"
                        : "border border-border bg-surface text-fg hover:border-accent hover:text-accent shadow-sm",
                    )}
                  >
                    {isActive ? "Selected" : "Select"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenStudio) {
                        onOpenStudio(bot.bot_id);
                      } else {
                        onSelect(bot.bot_id);
                      }
                    }}
                    className="flex-1 rounded-r1 border border-border bg-surface px-3 py-2 text-center text-[12.5px] font-[700] text-fg hover:border-accent hover:text-accent shadow-sm cursor-pointer"
                  >
                    Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenInstall(bot.bot_id)}
                    className="flex-1 rounded-r1 border border-border bg-surface px-3 py-2 text-[12.5px] font-[700] text-fg hover:border-accent hover:text-accent shadow-sm cursor-pointer"
                  >
                    Snippet
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <button
                    type="button"
                    onClick={() => setModal({ mode: "edit", bot })}
                    className="inline-flex items-center gap-1.5 text-[12px] font-[650] text-muted hover:text-fg cursor-pointer"
                  >
                    <PencilIcon /> Edit
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => togglePause(bot)}
                      disabled={busy || bot.suspended}
                      title={bot.suspended ? "Suspended by the platform — contact support." : undefined}
                      className="inline-flex items-center gap-1.5 text-[12px] font-[650] text-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      {bot.paused ? <PlayIcon /> : <PauseIcon />}
                      {bot.paused ? "Resume" : "Pause"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(bot)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-[650] text-muted hover:text-bad cursor-pointer"
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
              <Plus className="h-5 w-5" />
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
        <ConfirmDialog
          title={`Delete "${confirmDelete.name}"?`}
          body={
            <>
              This permanently removes the bot and <b>all its leads, conversations and
              documents</b>. This can&apos;t be undone.
            </>
          }
          confirmLabel="Delete bot"
          busy={busyId === confirmDelete.bot_id}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => doDelete(confirmDelete)}
        />
      )}
    </>
  );
}
