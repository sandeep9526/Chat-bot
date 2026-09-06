"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { AdminLead, AdminBot } from "@/lib/adminApi";
import { useDeleteLead, useBots } from "@/hooks/useAdmin";
import { GoogleSheetsSyncModal } from "./GoogleSheetsSyncModal";
import { submitLead } from "@/lib/api";
import { LEAD_SCORE_STYLE } from "@/lib/leadScore";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  Users,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  FlaskConical,
  Layers,
  Sparkles,
  ArrowRight,
  Loader2,
  Mail,
  Phone,
  Eye,
  Trash2,
  ExternalLink,
  MessageSquare,
  Search,
  Download,
  Flame,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Check,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

const AVATAR_COLORS = [
  "from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
  "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "from-rose-500/20 to-red-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30",
  "from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toCsv(leads: AdminLead[]): string {
  const head = ["name", "email", "phone", "score", "is_test", "custom_fields", "message", "date"];
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = leads.map((l) => {
    const isTest = Boolean(l.is_test || l.score === "test" || (l.custom_data && l.custom_data.is_test));
    const customFields = Object.entries(l.custom_data || {})
      .filter(([k]) => k !== "is_test")
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");
    return [
      l.name,
      l.email,
      l.phone ?? "",
      l.score,
      isTest ? "YES" : "NO",
      customFields,
      (l.message ?? "").replace(/\s+/g, " "),
      l.created_at,
    ]
      .map(esc)
      .join(",");
  });
  return [head.join(","), ...rows].join("\n");
}

type SortField = "name" | "date" | "score";
type SortOrder = "asc" | "desc";

export function LeadsTable({
  leads,
  botId,
  bot,
  onOpenFormBuilder,
}: {
  leads: AdminLead[];
  botId?: string;
  bot?: AdminBot;
  onOpenFormBuilder?: () => void;
}) {
  const del = useDeleteLead();
  const { data: bots } = useBots();
  const currentBot = bot ?? (bots ?? []).find((b) => b.bot_id === botId);
  const isSheetsConnected = Boolean(currentBot?.google_sheets_url && currentBot.google_sheets_url.trim());
  const queryClient = useQueryClient();

  // State
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState<"all" | "hot" | "warm" | "cold" | "test">("all");
  const [hideTestLeads, setHideTestLeads] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedLead, setSelectedLead] = useState<AdminLead | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminLead | null>(null);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedDrawerField, setCopiedDrawerField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const isTest = Boolean(l.is_test || l.score === "test" || (l.custom_data && l.custom_data.is_test));
      if (hideTestLeads && isTest) return false;

      const matchesScore =
        scoreFilter === "all" ||
        (scoreFilter === "test" ? isTest : l.score === scoreFilter);

      const searchLower = search.toLowerCase().trim();
      const customValues = Object.values(l.custom_data || {}).join(" ").toLowerCase();
      const matchesSearch =
        !searchLower ||
        l.name.toLowerCase().includes(searchLower) ||
        l.email.toLowerCase().includes(searchLower) ||
        (l.phone && l.phone.includes(searchLower)) ||
        (l.message && l.message.toLowerCase().includes(searchLower)) ||
        customValues.includes(searchLower);

      return matchesScore && matchesSearch;
    });
  }, [leads, scoreFilter, hideTestLeads, search]);

  // Sort leads
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      if (sortField === "name") {
        const cmp = a.name.localeCompare(b.name);
        return sortOrder === "asc" ? cmp : -cmp;
      }
      if (sortField === "score") {
        const scoreWeight: Record<string, number> = { hot: 3, warm: 2, cold: 1, test: 0 };
        const wa = scoreWeight[a.score] ?? 0;
        const wb = scoreWeight[b.score] ?? 0;
        const cmp = wa - wb;
        return sortOrder === "asc" ? cmp : -cmp;
      }
      // date
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return sortOrder === "asc" ? da - db : db - da;
    });
  }, [filteredLeads, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, currentPage, pageSize]);

  // Reset page to 1 if search/filter changes
  useEffect(() => {
    setPage(1);
  }, [search, scoreFilter, hideTestLeads, pageSize]);

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Selection handlers
  const handleSelectAllOnPage = (checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      paginatedLeads.forEach((l) => next.add(l.id));
    } else {
      paginatedLeads.forEach((l) => next.delete(l.id));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectRow = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const allOnPageSelected =
    paginatedLeads.length > 0 && paginatedLeads.every((l) => selectedIds.has(l.id));

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
    await queryClient.refetchQueries({ queryKey: ["admin", "leads"] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Export CSV handler
  const handleDownloadCsv = (exportOnlySelected = false) => {
    const targetLeads = exportOnlySelected
      ? leads.filter((l) => selectedIds.has(l.id))
      : filteredLeads;
    const blob = new Blob([toCsv(targetLeads)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Batch delete handler
  const handleBatchDelete = async () => {
    for (const id of Array.from(selectedIds)) {
      await del.mutateAsync(id);
    }
    setSelectedIds(new Set());
    setConfirmBatchDelete(false);
    queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
  };

  // Sample lead generation
  const handleGenerateSample = async () => {
    setIsGeneratingSample(true);
    try {
      await submitLead({
        botId: botId || "default",
        name: "Sarah Connor",
        email: "sarah@acme-design.com",
        phone: "+1 (555) 019-2834",
        message: "We love Woblo and want to discuss an Enterprise team license for 25 designers.",
        isTest: true,
        custom_data: {
          Company: "Acme Studios",
          "Team Size": "25 designers",
          Interest: "Enterprise Plan",
          is_test: true,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
      queryClient.refetchQueries({ queryKey: ["admin", "leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.refetchQueries({ queryKey: ["admin", "stats"] });
    } catch (err) {
      console.error("Failed to create sample lead:", err);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDrawerField(fieldName);
    setTimeout(() => setCopiedDrawerField(null), 2000);
  };

  const appsScriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  if (data.row) {
    sheet.appendRow(data.row);
  } else if (data.lead) {
    sheet.appendRow([new Date(), data.lead.name, data.lead.email, data.lead.phone || '', data.lead.score || 'cold', data.lead.message || '']);
  }
  return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
}`;

  return (
    <div className="w-full rounded-2xl border border-border bg-surface shadow-sm overflow-hidden min-h-[540px] flex flex-col relative">
      {/* Top Filter & Toolbar */}
      <div className="flex flex-col gap-3.5 border-b border-border px-5 py-4 bg-panel/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Title & Quick Score Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <b className="text-[15px] font-[800] text-fg tracking-tight">Leads</b>
              <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-[750] text-[11px]">
                {filteredLeads.length}
              </span>
            </div>

            <div className="flex items-center rounded-xl border border-border bg-surface p-0.5 text-xs shadow-2xs">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "hot", label: "Hot", icon: Flame, color: "text-red-500" },
                  { id: "warm", label: "Warm", icon: Zap, color: "text-amber-500" },
                  { id: "cold", label: "Cold" },
                  { id: "test", label: "Test", icon: FlaskConical, color: "text-purple-500" },
                ] as const
              ).map((s) => {
                const Icon = "icon" in s ? s.icon : null;
                const iconColor = "color" in s ? s.color : "";
                const isActive = scoreFilter === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScoreFilter(s.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-[650] cursor-pointer transition-all ${
                      isActive
                        ? "bg-accent text-white shadow-xs"
                        : "text-muted hover:text-fg hover:bg-panel"
                    }`}
                  >
                    {Icon && <Icon className={`h-3 w-3 ${isActive ? "text-white" : iconColor}`} />}
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Search & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Realtime Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name, email, query..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 sm:w-64 pl-8 pr-7 py-1.5 rounded-xl border border-border bg-surface text-xs text-fg placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg p-0.5 rounded cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh leads"
              className="p-2 rounded-xl border border-border bg-surface hover:bg-panel text-muted hover:text-fg transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-accent" : ""}`} />
            </button>

            {/* Google Sheets Sync Button */}
            <button
              type="button"
              onClick={() => setShowSheetsModal(true)}
              className={
                isSheetsConnected
                  ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-[650] text-xs transition-all shadow-2xs cursor-pointer active:scale-95"
                  : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-panel text-fg font-[650] text-xs transition-all shadow-2xs cursor-pointer active:scale-95"
              }
              title={isSheetsConnected ? "Google Sheets auto-sync is active" : "Connect Google Sheets"}
            >
              {isSheetsConnected ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : null}
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">
                {isSheetsConnected ? "Sheets Synced" : "Google Sheets"}
              </span>
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={() => handleDownloadCsv(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-panel text-fg font-[650] text-xs transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Download className="h-3.5 w-3.5 text-muted" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Secondary Sub-Bar: Test Lead Filter Toggle & Active Criteria */}
        <div className="flex items-center justify-between text-xs text-muted pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideTestLeads}
              onChange={(e) => setHideTestLeads(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent cursor-pointer"
            />
            <span className="font-medium text-fg/85">Hide testing leads</span>
          </label>

          <span className="text-[11.5px] text-muted">
            Showing <b>{paginatedLeads.length}</b> of <b>{filteredLeads.length}</b> lead{filteredLeads.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Floating Bulk Action Bar (when rows are selected) */}
      {selectedIds.size > 0 && (
        <div className="bg-accent/10 border-b border-accent/25 px-5 py-2.5 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
            <b className="font-[750] text-accent">
              {selectedIds.size} lead{selectedIds.size === 1 ? "" : "s"} selected
            </b>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadCsv(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-accent/30 text-accent font-[650] hover:bg-accent hover:text-white transition-all shadow-2xs cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>Export ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmBatchDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/25 text-red-600 font-[650] hover:bg-red-500 hover:text-white transition-all shadow-2xs cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-muted hover:text-fg px-2 py-1 font-medium cursor-pointer"
            >
              Deselect all
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-[.08em] text-faint border-b border-border bg-panel/30 select-none">
              {/* Checkbox Column */}
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={(e) => handleSelectAllOnPage(e.target.checked)}
                  aria-label="Select all leads on this page"
                  className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent cursor-pointer"
                />
              </th>

              {/* Sortable Lead Contact */}
              <th
                onClick={() => handleSort("name")}
                className="px-5 py-3 font-[750] cursor-pointer hover:text-fg transition-colors"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Lead Contact</span>
                  {sortField === "name" ? (
                    sortOrder === "asc" ? <ArrowUp className="h-3 w-3 text-accent" /> : <ArrowDown className="h-3 w-3 text-accent" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30 hover:opacity-100" />
                  )}
                </div>
              </th>

              <th className="px-5 py-3 font-[750]">Phone</th>
              <th className="px-5 py-3 font-[750]">Inquiry / Request</th>

              {/* Sortable Date */}
              <th
                onClick={() => handleSort("date")}
                className="px-5 py-3 font-[750] cursor-pointer hover:text-fg transition-colors"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Captured Date</span>
                  {sortField === "date" ? (
                    sortOrder === "asc" ? <ArrowUp className="h-3 w-3 text-accent" /> : <ArrowDown className="h-3 w-3 text-accent" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30 hover:opacity-100" />
                  )}
                </div>
              </th>

              {/* Sortable Score */}
              <th
                onClick={() => handleSort("score")}
                className="px-5 py-3 font-[750] cursor-pointer hover:text-fg transition-colors"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Score</span>
                  {sortField === "score" ? (
                    sortOrder === "asc" ? <ArrowUp className="h-3 w-3 text-accent" /> : <ArrowDown className="h-3 w-3 text-accent" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30 hover:opacity-100" />
                  )}
                </div>
              </th>

              <th className="px-5 py-3 font-[750] text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedLeads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16">
                  <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
                    <div className="mb-3.5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent/15 to-accent-strong/15 text-accent border border-accent/25 shadow-sm">
                      <Users className="h-7 w-7" />
                    </div>
                    <h4 className="text-[15px] font-[750] text-fg">
                      {leads.length === 0 ? "No visitor leads captured yet" : "No matching leads found"}
                    </h4>
                    <p className="mt-1.5 text-[13px] text-muted leading-relaxed">
                      {leads.length === 0
                        ? "Your agent automatically captures contact details, scores visitor intent, and collects custom questions during chat sessions."
                        : "No leads matched your current search filters. Try clearing your search query or score selection."}
                    </p>
                    {leads.length === 0 ? (
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={handleGenerateSample}
                          disabled={isGeneratingSample}
                          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-[650] text-white shadow-sm hover:bg-accent-strong transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                        >
                          {isGeneratingSample ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          <span>Generate Sample Lead</span>
                        </button>
                        <a
                          href="#playground"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-[650] text-fg hover:border-accent hover:text-accent transition-colors"
                        >
                          <span>Test in Playground</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setScoreFilter("all");
                          setHideTestLeads(false);
                        }}
                        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-panel border border-border text-fg font-[650] text-xs hover:bg-surface transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5 text-muted" />
                        <span>Reset All Filters</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {paginatedLeads.map((l) => {
              const isTest = Boolean(l.is_test || l.score === "test" || (l.custom_data && l.custom_data.is_test));
              const customEntries = Object.entries(l.custom_data || {}).filter(([k]) => k !== "is_test");
              const hasCustom = customEntries.length > 0;
              const isRowSelected = selectedIds.has(l.id);

              return (
                <tr
                  key={l.id}
                  onClick={() => setSelectedLead(l)}
                  className={`group border-t border-border/60 hover:bg-panel/70 transition-all cursor-pointer ${
                    isRowSelected ? "bg-accent/5 hover:bg-accent/10 shadow-[inset_2px_0_0_var(--accent)]" : ""
                  }`}
                >
                  {/* Selection Checkbox */}
                  <td className="w-10 px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isRowSelected}
                      onChange={() => handleToggleSelectRow(l.id)}
                      aria-label={`Select lead ${l.name}`}
                      className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent cursor-pointer"
                    />
                  </td>

                  {/* Lead Contact Info with Dynamic Avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-xl bg-gradient-to-br ${getAvatarColor(
                          l.name
                        )} border flex items-center justify-center font-[800] text-[12.5px] shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                      >
                        {getInitials(l.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-[700] text-fg truncate flex items-center gap-1.5">
                          <span className="group-hover:text-accent transition-colors">{l.name}</span>
                          {isTest && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[9.5px] font-[750] uppercase tracking-wider text-purple-600 dark:text-purple-400">
                              <FlaskConical className="h-2.5 w-2.5" />
                              Test
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-muted truncate max-w-[210px]">{l.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-5 py-3.5 text-muted text-[12.5px] whitespace-nowrap">
                    {l.phone ? (
                      <span className="font-mono text-[12px] text-fg/90">{l.phone}</span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>

                  {/* Inquiry / Message Snippet */}
                  <td className="px-5 py-3.5">
                    <div
                      className="max-w-[260px] truncate text-[12.5px] text-muted group-hover:text-fg transition-colors"
                      title={l.message || ""}
                    >
                      {l.message ? (
                        <span>"{l.message}"</span>
                      ) : hasCustom ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-[650] text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md">
                          <Layers className="h-3 w-3" />
                          {customEntries.length} custom field{customEntries.length === 1 ? "" : "s"}
                        </span>
                      ) : (
                        <span className="text-faint italic">No message</span>
                      )}
                    </div>
                  </td>

                  {/* Captured Date */}
                  <td className="px-5 py-3.5 text-[12px] font-[500] text-faint whitespace-nowrap">
                    {l.created_at
                      ? new Date(l.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>

                  {/* Intent Score */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {l.score === "hot" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/25 px-2.5 py-0.5 text-[11px] font-[750] text-red-600 dark:text-red-400">
                        <Flame className="h-3 w-3" />
                        <span>Hot</span>
                      </span>
                    ) : l.score === "warm" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[11px] font-[750] text-amber-600 dark:text-amber-400">
                        <Zap className="h-3 w-3" />
                        <span>Warm</span>
                      </span>
                    ) : isTest ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/25 px-2.5 py-0.5 text-[11px] font-[750] text-purple-600 dark:text-purple-400">
                        <FlaskConical className="h-3 w-3" />
                        <span>Test</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 border border-zinc-500/25 px-2.5 py-0.5 text-[11px] font-[750] text-zinc-600 dark:text-zinc-400">
                        <span>Cold</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedLead(l)}
                        className="cursor-pointer rounded-lg border border-border/80 bg-surface px-2.5 py-1 text-[11.5px] font-[650] text-muted hover:text-fg hover:border-accent hover:bg-panel flex items-center gap-1 transition-all shadow-2xs"
                      >
                        <Eye className="h-3 w-3 text-accent" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(l)}
                        disabled={del.isPending}
                        className="cursor-pointer rounded-lg p-1.5 text-muted hover:text-bad hover:bg-bad/10 transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 bg-panel/30 text-xs">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-muted">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-fg outline-none focus:border-accent cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Page Nav */}
        <div className="flex items-center gap-2">
          <span className="text-muted font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-lg border border-border bg-surface text-fg hover:bg-panel disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded-lg border border-border bg-surface text-fg hover:bg-panel disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over Lead Detail Drawer */}
      {selectedLead &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedLead(null)}
          >
            <div
              className="w-full max-w-[500px] h-full bg-surface border-l border-border shadow-2xl flex flex-col animate-slide-in-right overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-border bg-panel/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${getAvatarColor(
                      selectedLead.name
                    )} border flex items-center justify-center font-[800] text-[16px] shadow-sm`}
                  >
                    {getInitials(selectedLead.name)}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-[800] text-fg tracking-tight flex items-center gap-2">
                      <span>{selectedLead.name}</span>
                      {Boolean(
                        selectedLead.is_test ||
                          selectedLead.score === "test" ||
                          (selectedLead.custom_data && selectedLead.custom_data.is_test)
                      ) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-[750] uppercase text-purple-600 dark:text-purple-400">
                          <FlaskConical className="h-3 w-3" />
                          Testing
                        </span>
                      )}
                    </h3>
                    <span className="text-[12px] text-muted">
                      Captured{" "}
                      {selectedLead.created_at
                        ? new Date(selectedLead.created_at).toLocaleString()
                        : "recently"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-panel transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                {/* Communication Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-[700] text-[13px] shadow-sm hover:bg-accent-strong transition-all"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Send Email</span>
                  </a>
                  {selectedLead.phone ? (
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-panel text-fg font-[700] text-[13px] hover:bg-panel/80 transition-all"
                    >
                      <Phone className="h-4 w-4 text-accent" />
                      <span>Call Visitor</span>
                    </a>
                  ) : (
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-panel/40 text-muted/60 font-[650] text-[13px]">
                      <Phone className="h-4 w-4" />
                      <span>No Phone</span>
                    </div>
                  )}
                </div>

                {/* Contact Information Card */}
                <div className="rounded-2xl border border-border bg-panel/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-[800] uppercase tracking-wider text-muted">
                      Contact Details
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `Name: ${selectedLead.name}\nEmail: ${selectedLead.email}\nPhone: ${
                            selectedLead.phone || "N/A"
                          }\nMessage: ${selectedLead.message || "N/A"}`,
                          "all"
                        )
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-[650] text-accent hover:underline cursor-pointer"
                    >
                      {copiedDrawerField === "all" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Info</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <span className="text-muted block text-[11px] font-medium mb-0.5">Email</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-fg font-[650] text-[13px] break-all">
                          {selectedLead.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedLead.email, "email")}
                          className="text-muted hover:text-fg p-0.5 rounded cursor-pointer shrink-0"
                          title="Copy Email"
                        >
                          {copiedDrawerField === "email" ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted block text-[11px] font-medium mb-0.5">Phone</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-fg font-[650] text-[13px]">
                          {selectedLead.phone || "—"}
                        </span>
                        {selectedLead.phone && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedLead.phone!, "phone")}
                            className="text-muted hover:text-fg p-0.5 rounded cursor-pointer shrink-0"
                            title="Copy Phone"
                          >
                            {copiedDrawerField === "phone" ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-muted block text-[11px] font-medium mb-0.5">
                        Intent Score
                      </span>
                      <span className="mt-0.5 inline-block capitalize font-[700] text-fg">
                        {selectedLead.score}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted block text-[11px] font-medium mb-0.5">
                        Agent Scope
                      </span>
                      <span className="font-mono text-[12px] text-accent font-[650]">
                        {selectedLead.bot_id || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visitor Message */}
                {selectedLead.message && (
                  <div className="rounded-2xl border border-border bg-panel/30 p-4 space-y-2">
                    <h4 className="text-[11px] font-[800] uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-accent" />
                      <span>Visitor Inquiry Message</span>
                    </h4>
                    <p className="text-[13px] text-fg leading-relaxed bg-surface p-3.5 rounded-xl border border-border/60 whitespace-pre-wrap">
                      "{selectedLead.message}"
                    </p>
                  </div>
                )}

                {/* Custom Form Fields */}
                {Object.keys(selectedLead.custom_data || {}).filter((k) => k !== "is_test").length >
                  0 && (
                  <div className="rounded-2xl border border-border bg-panel/30 p-4 space-y-3">
                    <h4 className="text-[11px] font-[800] uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-accent" />
                      <span>Captured Custom Fields</span>
                    </h4>
                    <div className="space-y-2.5">
                      {Object.entries(selectedLead.custom_data || {})
                        .filter(([k]) => k !== "is_test")
                        .map(([k, v]) => (
                          <div key={k} className="p-3 rounded-xl bg-surface border border-border/60">
                            <span className="text-muted block text-[11px] font-[700] uppercase tracking-wide mb-0.5">
                              {k}
                            </span>
                            <span className="text-fg font-[650] text-[13.5px] break-words">
                              {String(v)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border bg-panel/40 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const leadToDel = selectedLead;
                    setSelectedLead(null);
                    setConfirmDelete(leadToDel);
                  }}
                  className="inline-flex items-center gap-1.5 text-bad text-[12.5px] font-[650] px-3 py-1.5 rounded-lg hover:bg-bad/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Lead</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 rounded-xl border border-border bg-surface text-fg font-[650] text-[12.5px] hover:bg-panel transition-colors cursor-pointer"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Google Sheets Modal */}
      {showSheetsModal && currentBot && (
        <GoogleSheetsSyncModal
          isOpen={showSheetsModal}
          onClose={() => setShowSheetsModal(false)}
          bot={currentBot}
          leadsCount={leads.length}
          onOpenFormBuilder={onOpenFormBuilder}
        />
      )}

      {/* Delete Single Lead Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.name}'s lead?`}
          body={`This removes ${confirmDelete.email} and can't be undone.`}
          confirmLabel="Delete lead"
          busy={del.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            del.mutate(confirmDelete.id, { onSettled: () => setConfirmDelete(null) });
          }}
        />
      )}

      {/* Batch Delete Leads Dialog */}
      {confirmBatchDelete && (
        <ConfirmDialog
          title={`Delete ${selectedIds.size} selected leads?`}
          body={`This will permanently remove ${selectedIds.size} leads and all their custom captured fields. This action cannot be undone.`}
          confirmLabel={`Delete ${selectedIds.size} leads`}
          busy={del.isPending}
          onCancel={() => setConfirmBatchDelete(false)}
          onConfirm={handleBatchDelete}
        />
      )}
    </div>
  );
}
