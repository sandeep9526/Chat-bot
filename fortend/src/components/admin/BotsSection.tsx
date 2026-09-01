"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Pencil as PencilIcon, Pause as PauseIcon, Play as PlayIcon, Trash2 as TrashIcon, Plus, Bot as BotIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteBot, useSetBotPaused } from "@/hooks/useAdmin";
import { AdminApiError, type AdminBot } from "@/lib/adminApi";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/panel/AppShell";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { CreationChoiceModal } from "./CreationChoiceModal";
import { AdvancedCreateModal } from "./AdvancedCreateModal";
import { EditBotModal } from "./EditBotModal";
import { ConfirmDialog } from "./ConfirmDialog";

export interface BotInitial {
  name: string;
  websiteUrl?: string;
  accent?: string;
  welcome?: string;
  suggestions?: string[];
}
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
  mode: "choice" | "wizard" | "advanced" | "edit";
  bot?: AdminBot;
  initial?: BotInitial;
  fromPending?: boolean;
};

/** Pre-filled create modal from a waiting "Make it yours" design, or null. */
function pendingModal(): ModalState | null {
  const pd = getPendingDesign();
  if (!pd) return null;
  return {
    mode: "wizard",
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
  onBotUpdated?: (id: string) => void;
  onOpenInstall: (id: string) => void;
  onOpenStudio?: (id: string) => void;
}

export function BotsSection({
  bots,
  activeBotId,
  maxBots,
  onSelect,
  onBotUpdated,
  onOpenInstall,
  onOpenStudio,
}: BotsSectionProps) {
  const queryClient = useQueryClient();

  // Open the pre-filled "Make it yours" create modal as the initial state (not
  // via an effect) so it appears on first paint and isn't cancelled by
  // StrictMode's dev mount/unmount cycle.
  const [modal, setModal] = useState<ModalState | null>(() =>
    autoOpenConsumed ? null : pendingModal(),
  );

  useEffect(() => {
    const handleOpen = () => setModal({ mode: "choice" });
    window.addEventListener("zeva:open-bot-modal", handleOpen);

    // Auto-resume onboarding draft if the user reloaded the page mid-onboarding
    try {
      if (localStorage.getItem("zeva-onboarding-draft") && !autoOpenConsumed) {
        setModal({ mode: "wizard" });
      }
    } catch { }

    return () => window.removeEventListener("zeva:open-bot-modal", handleOpen);
  }, []);

  const [confirmDelete, setConfirmDelete] = useState<AdminBot | null>(null);
  const [deleteError, setDeleteError] = useState("");
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
    setDeleteError("");
    try {
      await deleteMut.mutateAsync(bot.bot_id);
      setConfirmDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof AdminApiError ? err.message : "We couldn't delete this agent — try again in a moment.",
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <SectionHeader
        title="Your Agents"
        description={
          typeof maxBots === "number"
            ? `Manage every AI agent you run. ${bots.length} of ${maxBots} used on your plan.`
            : "Create, customize and manage every AI agent you run."
        }
        action={
          <button
            type="button"
            data-tour="new-bot"
            disabled={atLimit}
            onClick={() => setModal({ mode: "choice" })}
            title={atLimit ? "You've reached your plan's agent limit — upgrade to add more." : undefined}
            className="inline-flex items-center gap-1.5 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-4 py-2 text-[13.5px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New Agent
          </button>
        }
      />

      {atLimit && (
        <div className="mb-5 rounded-r2 border border-warn/30 bg-warn/10 px-4 py-3 text-[13px] text-warn">
          You&apos;re using all {maxBots} agent{maxBots === 1 ? "" : "s"} on your plan.{" "}
          <a href="mailto:support@ochreshift.app?subject=Upgrade%20my%20ochreshift%20plan" className="font-[650] underline">
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
            Create your first agent
          </h3>
          <p className="mx-auto mt-2 max-w-[46ch] text-[14.5px] leading-relaxed text-muted">
            Give it a name, add your docs later, and copy one script tag. You&apos;ll
            have a live, grounded AI agent in about a minute.
          </p>
          <button
            type="button"
            onClick={() => setModal({ mode: "choice" })}
            className="mt-6 inline-flex items-center gap-1.5 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-6 py-3 text-[14.5px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Create an agent
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
                  "group flex flex-col rounded-r2 border p-6 shadow-card transition-all duration-300 hover:-translate-y-[3px] hover:shadow-card-hover bg-gradient-to-br",
                  isActive
                    ? "border-accent/40 ring-2 ring-accent/20 from-accent/5 to-surface"
                    : "border-border/80 hover:border-accent/30 from-surface to-panel/50",
                )}
              >
                <div className="flex items-start justify-between gap-3 relative">
                  <div className="absolute -inset-6 bg-gradient-to-b from-white/50 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-t-r2" />
                  <div className="flex min-w-0 items-center gap-3 relative z-10">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[15px] font-[800] text-white shadow-md shadow-accent/20 transition-transform group-hover:scale-105 ring-1 ring-white/20"
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
                        "flex-1 rounded-lg px-3 py-2 text-[12.5px] font-[650] transition-all cursor-pointer relative overflow-hidden",
                        isActive
                          ? "cursor-default bg-panel text-faint border border-border/50"
                          : "border border-border/80 bg-surface text-fg hover:border-accent hover:text-accent shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]",
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
                      className="flex-1 rounded-lg border border-border/80 bg-surface px-3 py-2 text-center text-[12.5px] font-[650] text-fg hover:border-accent hover:text-accent shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] cursor-pointer transition-all"
                    >
                      Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenInstall(bot.bot_id)}
                      className="flex-1 rounded-lg border border-border/80 bg-surface px-3 py-2 text-[12.5px] font-[650] text-fg hover:border-accent hover:text-accent shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] cursor-pointer transition-all"
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
              onClick={() => setModal({ mode: "choice" })}
              className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-r2 border border-dashed border-border bg-surface/40 p-5 text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full border border-current">
                <Plus className="h-5 w-5" />
              </span>
              <span className="text-[13px] font-[650]">New agent</span>
            </button>
          )}
        </div>
      )}

      {modal?.mode === "choice" && (
        <CreationChoiceModal
          onClose={() => setModal(null)}
          onSelectWizard={() => setModal({ mode: "wizard" })}
          onSelectAdvanced={() => setModal({ mode: "advanced" })}
        />
      )}

      {modal?.mode === "advanced" && (
        <AdvancedCreateModal
          onClose={() => setModal(null)}
          onSaved={(id) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "bots"] });
            setModal(null);
            if (onBotUpdated) onBotUpdated(id);
          }}
        />
      )}

      {modal?.mode === "edit" && modal.bot && (
        <EditBotModal
          bot={modal.bot}
          onClose={() => setModal(null)}
          onSaved={(id) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "bots"] });
            setModal(null);
            if (onBotUpdated) onBotUpdated(id);
          }}
        />
      )}

      {modal?.mode === "wizard" && (
        <OnboardingWizard
          onClose={() => {
            if (modal.fromPending) autoOpenConsumed = true;
            setModal(null);
          }}
          onSaved={(id) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "bots"] });
            setModal(null);
            if (pendingConfig) {
              stashBotDesign(id, pendingConfig, getPendingDesign()?.websiteUrl ?? "");
              clearPendingDesign();
              setPendingConfig(null);
              autoOpenConsumed = true;
            }
            if (onBotUpdated) onBotUpdated(id);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${confirmDelete.name}"?`}
          body={
            <>
              Are you sure you want to delete <b>{confirmDelete.name}</b>? This agent and all its leads, conversations and documents will be permanently erased. This can&apos;t be undone.
            </>
          }
          confirmLabel="Delete agent"
          busy={busyId === confirmDelete.bot_id}
          error={deleteError}
          onCancel={() => {
            setConfirmDelete(null);
            setDeleteError("");
          }}
          onConfirm={() => doDelete(confirmDelete)}
        />
      )}
    </>
  );
}
