"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Bot as BotIcon,
  Search,
  FileText,
  Globe,
  Check,
  Copy,
  ArrowRight,
  Code,
  MessageSquare,
  Users,
  Settings,
  Trash2 as TrashIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  MoreHorizontal,
  Pencil as PencilIcon,
  Sparkles,
  Zap,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteBot, useSetBotPaused, useStats, useDocs } from "@/hooks/useAdmin";
import { AdminApiError, type AdminBot } from "@/lib/adminApi";
import { cn } from "@/lib/cn";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { CreationChoiceModal } from "./CreationChoiceModal";
import { AdvancedCreateModal } from "./AdvancedCreateModal";
import { EditBotModal } from "./EditBotModal";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  getPendingDesign,
  clearPendingDesign,
  stashBotDesign,
} from "@/lib/pendingDesign";
import type { OchreshiftConfig } from "@/lib/types";

export interface BotInitial {
  name: string;
  websiteUrl?: string;
  accent?: string;
  welcome?: string;
  suggestions?: string[];
}

let autoOpenConsumed = false;

type ModalState = {
  mode: "choice" | "wizard" | "advanced" | "edit";
  bot?: AdminBot;
  initial?: BotInitial;
  fromPending?: boolean;
};

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
      suggestions: (pd.config.suggestions ?? []).filter((s: string) => s.trim()),
    },
  };
}

interface BotsSectionProps {
  bots: AdminBot[];
  activeBotId: string;
  maxBots?: number;
  onSelect: (id: string) => void;
  onNavigate?: (section: string) => void;
  onBotUpdated?: (id: string) => void;
  onOpenInstall: (id: string) => void;
  onOpenStudio?: (id: string) => void;
  onTestAgent?: (id: string) => void;
}

export function BotsSection({
  bots,
  activeBotId,
  maxBots,
  onSelect,
  onNavigate,
  onBotUpdated,
  onOpenInstall,
  onOpenStudio,
  onTestAgent,
}: BotsSectionProps) {
  const queryClient = useQueryClient();

  const [modal, setModal] = useState<ModalState | null>(() =>
    autoOpenConsumed ? null : pendingModal(),
  );

  useEffect(() => {
    const handleOpen = () => setModal({ mode: "choice" });
    window.addEventListener("ochreshift:open-bot-modal", handleOpen);

    try {
      if (localStorage.getItem("ochreshift-onboarding-draft") && !autoOpenConsumed) {
        setModal({ mode: "wizard" });
      }
    } catch { }

    return () => window.removeEventListener("ochreshift:open-bot-modal", handleOpen);
  }, []);

  const [confirmDelete, setConfirmDelete] = useState<AdminBot | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [pendingConfig, setPendingConfig] = useState<OchreshiftConfig | null>(
    () => getPendingDesign()?.config ?? null,
  );

  const pauseMut = useSetBotPaused();
  const deleteMut = useDeleteBot();
  const [busyId, setBusyId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const totalSlots = maxBots ?? 5;
  const atLimit = typeof maxBots === "number" && bots.length >= maxBots;

  const filteredBots = useMemo(() => {
    if (!searchQuery.trim()) return bots;
    const q = searchQuery.toLowerCase();
    return bots.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.bot_id.toLowerCase().includes(q) ||
        (b.model_override || "").toLowerCase().includes(q)
    );
  }, [bots, searchQuery]);

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
      const remaining = bots.filter((b) => b.bot_id !== bot.bot_id);
      if (remaining.length > 0) {
        onSelect(remaining[0].bot_id);
      }
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
      {/* 1. Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-[750] tracking-tight text-fg">
              Agents
            </h1>
            <span className="rounded-full border border-border bg-panel px-2.5 py-0.5 text-[11.5px] font-[600] text-muted">
              {bots.length} of {totalSlots} deployed
            </span>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Configure, test, and manage your AI assistants across your websites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {bots.length > 2 && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents..."
                className="w-48 sm:w-56 rounded-xl border border-border bg-surface pl-8 pr-3 py-1.5 text-[12px] text-fg placeholder:text-muted outline-none focus:border-accent shadow-2xs"
              />
            </div>
          )}

          <button
            type="button"
            data-tour="new-bot"
            disabled={atLimit}
            onClick={() => setModal({ mode: "choice" })}
            title={atLimit ? "You've reached your plan's agent limit." : undefined}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[12.5px] font-[650] text-white shadow-2xs hover:bg-accent-strong transition-all disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Agent</span>
          </button>
        </div>
      </div>

      {/* 2. Cards Grid */}
      {bots.length === 0 ? (
        <div
          data-tour="new-bot-empty"
          className="rounded-2xl border border-dashed border-border bg-surface/50 p-12 text-center shadow-2xs"
        >
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
            <BotIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-[18px] font-[750] tracking-tight text-fg">
            Deploy your first AI agent
          </h3>
          <p className="mx-auto mt-1.5 max-w-[44ch] text-[13px] leading-relaxed text-muted">
            Give it a name, ground it with documentation, and copy your embed script. Ready in under 2 minutes.
          </p>
          <button
            type="button"
            onClick={() => setModal({ mode: "choice" })}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[12.5px] font-[650] text-white shadow-2xs hover:bg-accent-strong transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create an agent</span>
          </button>
        </div>
      ) : filteredBots.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-border bg-surface">
          <p className="text-[13px] font-[600] text-fg">No agents match your search.</p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-1.5 text-[12px] font-[650] text-accent hover:underline cursor-pointer"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {filteredBots.map((bot) => (
            <BotCard
              key={bot.bot_id}
              bot={bot}
              isActiveWorkspace={bot.bot_id === activeBotId}
              busy={busyId === bot.bot_id}
              onSelect={onSelect}
              onNavigate={onNavigate}
              onTestAgent={onTestAgent}
              onOpenStudio={onOpenStudio}
              onOpenInstall={onOpenInstall}
              onEdit={(b) => setModal({ mode: "edit", bot: b })}
              onTogglePause={togglePause}
              onDelete={(b) => setConfirmDelete(b)}
            />
          ))}

          {/* "+ Deploy New Agent" Card Slot */}
          {!atLimit && (
            <button
              type="button"
              onClick={() => setModal({ mode: "choice" })}
              className="group flex min-h-[310px] flex-col items-center justify-center gap-3.5 rounded-2xl border-2 border-dashed border-border/80 bg-surface/40 p-6 text-muted hover:border-accent hover:bg-panel/40 hover:shadow-sm transition-all duration-200 cursor-pointer"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-panel border border-border text-muted group-hover:text-accent group-hover:border-accent/40 group-hover:scale-105 transition-all shadow-2xs">
                <Plus className="h-6 w-6" />
              </div>
              <div className="text-center px-4">
                <span className="text-[15px] font-[750] text-fg group-hover:text-accent transition-colors block">
                  Deploy New Agent
                </span>
                <span className="text-[12.5px] text-muted max-w-[220px] mt-1 block leading-relaxed">
                  Ground with docs, customize theme, and launch in minutes.
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-3 py-0.5 text-[11px] font-[650] text-accent">
                {totalSlots - bots.length} slots available
              </span>
            </button>
          )}
        </div>
      )}

      {/* Modals */}
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
            onSelect(id);
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
            if (onSelect) onSelect(id);
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

/* ============================ BotCard Component ============================ */

function BotCard({
  bot,
  isActiveWorkspace,
  busy,
  onSelect,
  onNavigate,
  onTestAgent,
  onOpenStudio,
  onOpenInstall,
  onEdit,
  onTogglePause,
  onDelete,
}: {
  bot: AdminBot;
  isActiveWorkspace: boolean;
  busy: boolean;
  onSelect: (id: string) => void;
  onNavigate?: (section: string) => void;
  onTestAgent?: (id: string) => void;
  onOpenStudio?: (id: string) => void;
  onOpenInstall: (id: string) => void;
  onEdit: (bot: AdminBot) => void;
  onTogglePause: (bot: AdminBot) => void;
  onDelete: (bot: AdminBot) => void;
}) {
  const { data: stats } = useStats(bot.bot_id);
  const { data: docs = [] } = useDocs(bot.bot_id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = () => setMenuOpen(false);
    window.addEventListener("click", handleOutside);
    return () => window.removeEventListener("click", handleOutside);
  }, [menuOpen]);

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bot.bot_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1600);
  };

  const copySnippet = (e: React.MouseEvent) => {
    e.stopPropagation();
    const snippet = `<script src="https://cdn.ochreshift.app/widget.js" data-bot-id="${bot.bot_id}" async></script>`;
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 1600);
  };

  const totalChats = stats?.chats ?? 0;
  const totalLeads = stats?.leads ?? 0;
  const unanswered = stats?.unanswered ?? 0;
  const autonomy = totalChats > 0
    ? Math.max(0, Math.round(((totalChats - unanswered) / totalChats) * 100)) + "%"
    : "100%";

  return (
    <div
      data-tour="bot-card"
      onClick={() => onSelect(bot.bot_id)}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer",
        isActiveWorkspace
          ? "border-accent/60 ring-1 ring-accent/30 bg-gradient-to-b from-accent/[0.03] via-surface to-surface shadow-sm"
          : "border-border/80 bg-surface hover:border-accent/40"
      )}
    >
      <div>
        {/* Top Header: Avatar, Info, Status, Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Luminous Avatar with Status Dot */}
            <div className="relative shrink-0">
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl text-[17px] font-[800] text-white shadow-xs transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${bot.accent || "var(--accent)"}, var(--accent-strong))`
                }}
              >
                {bot.name.slice(0, 1).toUpperCase()}
              </span>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface",
                  bot.suspended
                    ? "bg-red-500"
                    : bot.paused
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                )}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-[16.5px] font-[800] tracking-tight text-fg group-hover:text-accent transition-colors">
                  {bot.name}
                </span>
                {isActiveWorkspace && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-[750] text-accent">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-muted">
                <button
                  type="button"
                  onClick={copyId}
                  title="Click to copy Bot ID"
                  className="font-mono hover:text-fg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{bot.bot_id}</span>
                  {copiedId ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
                  )}
                </button>
                <span>·</span>
                <span className="font-mono">{bot.model_override || "gpt-4o-mini"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Status Pill */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-[700] border",
                bot.suspended
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : bot.paused
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  bot.suspended
                    ? "bg-red-500"
                    : bot.paused
                      ? "bg-amber-500"
                      : "bg-emerald-500 animate-pulse"
                )}
              />
              {bot.suspended ? "Suspended" : bot.paused ? "Paused" : "Live"}
            </span>

            {/* Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:text-fg hover:bg-panel transition-colors cursor-pointer"
                title="Options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenInstall(bot.bot_id);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-[600] text-fg hover:bg-panel transition-colors cursor-pointer"
                  >
                    <Code className="h-3.5 w-3.5 text-muted" />
                    <span>Install Instructions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(bot);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-[600] text-fg hover:bg-panel transition-colors cursor-pointer"
                  >
                    <PencilIcon className="h-3.5 w-3.5 text-muted" />
                    <span>Edit Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onTogglePause(bot);
                    }}
                    disabled={busy || bot.suspended}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-[600] text-fg hover:bg-panel transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {bot.paused ? (
                      <>
                        <PlayIcon className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Resume Agent</span>
                      </>
                    ) : (
                      <>
                        <PauseIcon className="h-3.5 w-3.5 text-amber-500" />
                        <span>Pause Agent</span>
                      </>
                    )}
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(bot);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-[600] text-bad hover:bg-bad/10 transition-colors cursor-pointer"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    <span>Delete Agent</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Greeting Preview Bubble (Brings the agent to life!) */}
        <div className="mt-4 rounded-xl bg-panel/50 border border-border/60 px-3.5 py-2.5 text-[12.5px] text-muted leading-relaxed flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p className="line-clamp-2 italic text-fg/80">
            &ldquo;{bot.welcome || `Hi! I'm ${bot.name}. How can I assist you today?`}&rdquo;
          </p>
        </div>

        {/* Modern Clean Metrics Strip (Divide-X, No ugly grey boxes!) */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-border/60 border-y border-border/60 py-3">
          {/* Chats */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(bot.bot_id);
              if (onTestAgent) onTestAgent(bot.bot_id);
              else if (onNavigate) onNavigate("playground");
            }}
            title="Click to view conversations"
            className="text-center px-2 hover:opacity-80 transition-opacity cursor-pointer group/stat"
          >
            <span className="text-[20px] font-[800] text-fg block group-hover/stat:text-accent transition-colors leading-tight">
              {totalChats}
            </span>
            <span className="text-[11px] font-[650] text-muted uppercase tracking-wider block mt-0.5 group-hover/stat:text-fg transition-colors">
              Chats
            </span>
          </button>

          {/* Leads */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(bot.bot_id);
              if (onNavigate) onNavigate("leads");
            }}
            title="Click to view captured leads"
            className="text-center px-2 hover:opacity-80 transition-opacity cursor-pointer group/stat"
          >
            <span className="text-[20px] font-[800] text-emerald-600 dark:text-emerald-400 block leading-tight">
              {totalLeads}
            </span>
            <span className="text-[11px] font-[650] text-muted uppercase tracking-wider block mt-0.5 group-hover/stat:text-fg transition-colors">
              Leads
            </span>
          </button>

          {/* Knowledge Sources */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(bot.bot_id);
              if (onNavigate) onNavigate("knowledge");
            }}
            title="Click to manage knowledge sources"
            className="text-center px-2 hover:opacity-80 transition-opacity cursor-pointer group/stat"
          >
            <span className="text-[20px] font-[800] text-fg block group-hover/stat:text-accent transition-colors leading-tight">
              {docs.length}
            </span>
            <span className="text-[11px] font-[650] text-muted uppercase tracking-wider block mt-0.5 group-hover/stat:text-fg transition-colors">
              Docs
            </span>
          </button>
        </div>

        {/* Scope & Autonomy Meta Row */}
        <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted px-0.5">
          <span className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 opacity-60" />
            <span>{bot.allowed_domains?.length ? `${bot.allowed_domains.length} domain${bot.allowed_domains.length === 1 ? "" : "s"}` : "Global (all websites)"}</span>
          </span>
          <span className="flex items-center gap-1 font-[650] text-emerald-600 dark:text-emerald-400">
            <Zap className="h-3 w-3" />
            <span>{autonomy} resolution</span>
          </span>
        </div>
      </div>

      {/* Action Footer: Test Sandbox, 1-Click Snippet, Studio */}
      <div
        className="mt-5 flex items-center justify-between gap-2 border-t border-border/50 pt-3.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {/* Test Button */}
          <button
            type="button"
            onClick={() => {
              onSelect(bot.bot_id);
              if (onTestAgent) onTestAgent(bot.bot_id);
              else if (onNavigate) onNavigate("playground");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel/50 px-3 py-1.5 text-[12px] font-[650] text-fg hover:border-accent hover:bg-surface hover:text-accent shadow-2xs transition-all cursor-pointer"
          >
            <PlayIcon className="h-3 w-3 text-accent fill-accent" />
            <span>Test</span>
          </button>

          {/* 1-Click Snippet Copy */}
          <button
            type="button"
            onClick={copySnippet}
            title="Click to copy embed script tag"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel/50 px-2.5 py-1.5 text-[12px] font-[650] text-fg hover:border-accent hover:bg-surface hover:text-accent shadow-2xs transition-all cursor-pointer"
          >
            {copiedSnippet ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-[700]">Copied!</span>
              </>
            ) : (
              <>
                <Code className="h-3 w-3 text-muted" />
                <span>Embed</span>
              </>
            )}
          </button>
        </div>

        {/* Primary Studio Button */}
        <button
          type="button"
          onClick={() => {
            onSelect(bot.bot_id);
            if (onOpenStudio) onOpenStudio(bot.bot_id);
            else if (onNavigate) onNavigate("appearance");
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-strong text-white px-3.5 py-1.5 text-[12px] font-[700] transition-all shadow-2xs cursor-pointer group/btn"
        >
          <span>Studio</span>
          <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
