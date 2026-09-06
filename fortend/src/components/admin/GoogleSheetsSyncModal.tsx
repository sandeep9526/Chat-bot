"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { AdminBot } from "@/lib/adminApi";
import { useCreateBot } from "@/hooks/useAdmin";
import { testGoogleSheets, syncGoogleSheetsHistory } from "@/lib/adminApi";
import {
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  ExternalLink,
  AlertCircle,
  Loader2,
  X,
  Zap,
  Check,
  Trash2,
  Sparkles,
  SlidersHorizontal,
  Pencil,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Code2,
  ArrowRight,
} from "lucide-react";

export interface FormFieldSchema {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "dropdown";
  required: boolean;
  options?: string[];
  system?: boolean;
}

const DEFAULT_FIELDS: FormFieldSchema[] = [
  { id: "name", label: "Full Name", type: "text", required: true, system: true },
  { id: "email", label: "Email Address", type: "email", required: true, system: true },
  { id: "phone", label: "Phone Number", type: "tel", required: false, system: false },
  { id: "message", label: "How can we help you?", type: "textarea", required: false, system: false },
];

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (url: string) => void;
  bot: AdminBot;
  leadsCount?: number;
  onOpenFormBuilder?: () => void;
}

function generateAppsScript(fields: FormFieldSchema[], sheetTitle: string): string {
  const headersList = [
    "Timestamp",
    "Lead ID",
    ...fields.map((f) => f.label),
    "Lead Score",
    "AI Summary",
  ];

  const headerJson = JSON.stringify(headersList, null, 8);

  const mappingLines = fields.map((f) => {
    const fid = f.id;
    const flabel = f.label;
    if (fid === "name" || flabel.toLowerCase().includes("name")) {
      return `      data.name || custom[${JSON.stringify(flabel)}] || custom[${JSON.stringify(fid)}] || '',`;
    }
    if (fid === "email" || flabel.toLowerCase().includes("email") || f.type === "email") {
      return `      data.email || custom[${JSON.stringify(flabel)}] || custom[${JSON.stringify(fid)}] || '',`;
    }
    if (fid === "phone" || flabel.toLowerCase().includes("phone") || f.type === "tel") {
      return `      data.phone || custom[${JSON.stringify(flabel)}] || custom[${JSON.stringify(fid)}] || '',`;
    }
    if (
      fid === "message" ||
      flabel.toLowerCase().includes("help") ||
      flabel.toLowerCase().includes("message") ||
      f.type === "textarea"
    ) {
      return `      data.message || custom[${JSON.stringify(flabel)}] || custom[${JSON.stringify(fid)}] || '',`;
    }
    return `      custom[${JSON.stringify(flabel)}] || custom[${JSON.stringify(fid)}] || '',`;
  });

  return `function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    var custom = data.customData || {};

    // Auto-name sheet if it still has default "Untitled spreadsheet" title
    if (!ss.getName() || ss.getName().toLowerCase() === "untitled spreadsheet") {
      try {
        ss.rename(${JSON.stringify(sheetTitle || "Ochreshift Leads")});
      } catch (renameErr) {}
    }

    // Auto-create styled headers on row 1 if sheet is blank
    if (sheet.getLastRow() === 0) {
      var headers = ${headerJson.replace(/\n\s*\]/, " ]")};
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f3f4f6");
      sheet.setFrozenRows(1);
    }

    // If pre-formatted row array is provided, append directly
    if (data.row && Array.isArray(data.row)) {
      sheet.appendRow([now, ...data.row]);
      return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Lead Capture Form Fields synced row:
    var row = [
      now,
      data.leadId || '',
${mappingLines.join("\n")}
      data.score || 'cold',
      data.summary || ''
    ];

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
}

export function GoogleSheetsSyncModal({
  isOpen,
  onClose,
  onSaved,
  bot,
  leadsCount = 0,
  onOpenFormBuilder,
}: GoogleSheetsSyncModalProps) {
  const qc = useQueryClient();
  const updateBot = useCreateBot();

  const [url, setUrl] = useState(bot.google_sheets_url ?? "");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Sheet naming confirmation gate — user must type-to-confirm (GitHub-style delete confirmation pattern)
  const [sheetNameConfirmInput, setSheetNameConfirmInput] = useState("");
  const alreadyConnected = Boolean(bot.google_sheets_url && bot.google_sheets_url.trim());
  const sheetDefaultTitle = `${bot.name || "My Bot"} Leads - Ochreshift`;
  const isSheetNamed = alreadyConnected || sheetNameConfirmInput.trim().toLowerCase() === sheetDefaultTitle.trim().toLowerCase();

  // Form Fields synchronization state
  const [formFields, setFormFields] = useState<FormFieldSchema[]>(DEFAULT_FIELDS);
  const [showAllColumns, setShowAllColumns] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setUrl(bot.google_sheets_url ?? "");
    setTestResult(null);
    setBackfillResult(null);
    setSheetNameConfirmInput("");
  }, [bot.google_sheets_url, isOpen]);

  // Load latest configured Lead Capture Form Fields
  useEffect(() => {
    if (!isOpen || !bot?.bot_id) return;

    const preloaded =
      (bot.design as any)?.form_schema || (bot as any)?.form_schema;
    if (Array.isArray(preloaded) && preloaded.length > 0) {
      setFormFields(preloaded);
      return;
    }

    async function loadBotSchema() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${apiUrl}/config?botId=${encodeURIComponent(bot.bot_id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.formSchema && Array.isArray(data.formSchema) && data.formSchema.length > 0) {
            setFormFields(data.formSchema);
          } else {
            setFormFields(DEFAULT_FIELDS);
          }
        }
      } catch (err) {
        console.warn("[GoogleSheetsSyncModal] Could not fetch form schema:", err);
      }
    }

    loadBotSchema();
  }, [bot, isOpen]);

  const appsScriptSnippet = useMemo(() => {
    return generateAppsScript(formFields, sheetDefaultTitle);
  }, [formFields, sheetDefaultTitle]);

  if (!isOpen || !mounted) return null;

  const isConnected = Boolean(bot.google_sheets_url && bot.google_sheets_url.trim());
  const isValidUrl = url.trim().startsWith("https://script.google.com/");

  const totalColumnsCount = formFields.length + 4; // Timestamp, Lead ID, ...fields, Lead Score, AI Summary

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyDescription = () => {
    navigator.clipboard.writeText("Ochreshift Leads Sync");
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(sheetDefaultTitle);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2500);
  };

  const handleOpenAndCopyTitle = () => {
    // Copy the suggested title to user's clipboard automatically before opening
    try {
      navigator.clipboard.writeText(sheetDefaultTitle);
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 3000);
    } catch (e) {}
    window.open("https://sheets.new", "_blank", "noopener,noreferrer");
  };

  const handleTestConnection = async () => {
    if (!isValidUrl) {
      setTestResult({
        ok: false,
        message: "Please enter a valid Apps Script URL starting with https://script.google.com/",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testGoogleSheets(bot.bot_id, url.trim());
      setTestResult({
        ok: true,
        message: res.message || "Test lead row was successfully delivered to your spreadsheet!",
      });
    } catch (err: any) {
      const errMsg = err.message || "";
      const is403 =
        errMsg.includes("403") ||
        errMsg.toLowerCase().includes("forbidden") ||
        errMsg.toLowerCase().includes("access");
      setTestResult({
        ok: false,
        message: is403
          ? "Google returned 403 Forbidden. Make sure in your deployment 'Who has access' is set to 'Anyone', and you have authorized permissions in Apps Script."
          : errMsg || "Failed to reach Google Sheets. Make sure deployment access is set to 'Anyone'.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBot.mutateAsync({
        botId: bot.bot_id,
        name: bot.name,
        googleSheetsUrl: url.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ["admin", "bots"] });
      onSaved?.(url.trim());
      onClose();
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || "Failed to save configuration.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Sheets auto-sync?")) {
      return;
    }
    setIsSaving(true);
    try {
      await updateBot.mutateAsync({
        botId: bot.bot_id,
        name: bot.name,
        googleSheetsUrl: undefined,
      });
      setUrl("");
      qc.invalidateQueries({ queryKey: ["admin", "bots"] });
      onSaved?.("");
      onClose();
    } catch (err: any) {
      alert("Failed to disconnect: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackfill = async () => {
    const targetUrl = url.trim() || bot.google_sheets_url || "";
    if (!targetUrl.startsWith("https://script.google.com/")) {
      alert("Please provide a valid Google Apps Script URL first.");
      return;
    }

    setIsBackfilling(true);
    setBackfillResult(null);

    try {
      const res = await syncGoogleSheetsHistory(bot.bot_id, targetUrl);
      setBackfillResult(res.message);
    } catch (err: any) {
      alert("Backfill failed: " + err.message);
    } finally {
      setIsBackfilling(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[700px] rounded-2xl sm:rounded-3xl border border-border/80 bg-surface shadow-2xl overflow-hidden my-auto animate-fade-in-up flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 sm:px-7 py-4.5 bg-panel/30">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-[17px] font-[800] text-fg tracking-tight">
                  Google Sheets Auto-Sync
                </h3>
                {isConnected && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-[700]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <p className="text-[12px] sm:text-[12.5px] text-muted mt-0.5">
                Automatically stream captured leads directly into Google Sheets in real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted hover:bg-panel hover:text-fg cursor-pointer transition-colors"
            title="Close"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Active Connection Info Bar (if connected) */}
          {isConnected && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-fg font-[700] text-xs">Connected Google Sheet Webhook</p>
                  <p className="font-mono text-[11.5px] text-muted truncate max-w-[280px] sm:max-w-[420px] mt-0.5">
                    {bot.google_sheets_url}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-[700] text-[11.5px] transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 1: PREPARE SHEET & APPS SCRIPT                            */}
          {/* ============================================================== */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-xs font-[800] shadow-xs">
                  1
                </span>
                <h4 className="text-[14.5px] font-[800] text-fg tracking-tight">
                  Open your Spreadsheet &amp; Apps Script
                </h4>
              </div>

              {onOpenFormBuilder && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFormBuilder();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-[700] cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Customize Form Fields</span>
                </button>
              )}
            </div>

            {/* Combined Clean Card: Open Pre-Named Sheet + Menu Guide */}
            <div className="rounded-2xl border border-border/80 bg-panel/30 overflow-hidden divide-y divide-border/60">
              {/* Row A: Open Clean Sheet Action & Name Sheet Guidance */}
              <div className="p-3.5 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20 shrink-0">
                      <Sparkles className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-[750] text-fg">
                          Create &amp; Name Your Google Sheet
                        </p>
                        <button
                          type="button"
                          onClick={handleCopyTitle}
                          className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline font-[700] cursor-pointer"
                          title="Click to copy suggested sheet title"
                        >
                          {copiedTitle ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedTitle ? "Title Copied!" : "Copy Title"}</span>
                        </button>
                      </div>
                      <p className="text-[11.5px] text-muted mt-0.5">
                        Required name: <span className="font-semibold text-fg font-mono">"{sheetDefaultTitle}"</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAndCopyTitle}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border/80 bg-surface hover:bg-panel text-fg font-[700] text-xs transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95"
                    title="Copies title to clipboard and opens Google Sheets"
                  >
                    <span>Open sheets.new</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted" />
                  </button>
                </div>

                {/* Hard gate: User must type exact sheet name to confirm (GitHub delete-repo pattern) */}
                {!alreadyConnected && (
                  <div className="rounded-xl bg-panel/60 border border-border/70 p-3.5 space-y-2.5 text-[11.5px]">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className={`h-2 w-2 rounded-full shrink-0 mt-1.5 ${isSheetNamed ? 'bg-emerald-500' : 'bg-accent animate-ping'}`} />
                      <p className="text-muted leading-relaxed">
                        After renaming your sheet, <b className="text-fg">type the exact sheet name below</b> to confirm and unlock the next steps:
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={sheetNameConfirmInput}
                        onChange={(e) => setSheetNameConfirmInput(e.target.value)}
                        placeholder={`Type: ${sheetDefaultTitle}`}
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-[12px] font-mono text-fg outline-none transition-all shadow-xs ${
                          isSheetNamed
                            ? 'border-emerald-500/40 bg-emerald-500/5 ring-2 ring-emerald-500/15 focus:ring-emerald-500/25'
                            : 'border-border bg-surface focus:ring-2 focus:ring-accent/20 focus:border-accent hover:border-border-strong'
                        }`}
                      />
                      {isSheetNamed && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <Check className="h-4 w-4 stroke-[3]" />
                          <span className="text-[11px] font-[750]">Confirmed</span>
                        </div>
                      )}
                    </div>

                    {!isSheetNamed && (
                      <p className="text-[10.5px] text-muted/70 flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                        Steps 2 & 3 are locked until you confirm the sheet name
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Row B: Clear Menu Path Breadcrumb */}
              <div className="px-4 py-2.5 bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-muted text-[12px]">
                  In your Google Sheet top menu, navigate to:
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-panel border border-border text-fg font-[700] text-[11.5px]">
                    Extensions
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted shrink-0" />
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-[750] text-[11.5px]">
                    <Code2 className="h-3.5 w-3.5" />
                    Apps Script
                  </span>
                </div>
              </div>
            </div>

            {/* Code Snippet Header & Collapsible Columns */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted text-[12px]">
                    Paste into your <b>Apps Script editor</b>:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllColumns(!showAllColumns)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-border/80 bg-panel hover:bg-surface text-fg text-[11px] font-[650] transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="h-3 w-3 text-accent" />
                    <span>{totalColumnsCount} Form Columns</span>
                    {showAllColumns ? (
                      <ChevronUp className="h-3 w-3 text-muted" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted" />
                    )}
                  </button>
                </div>

                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-[650] flex items-center gap-1">
                  ✨ Auto-creates styled row 1 headers
                </span>
              </div>

              {/* Collapsed Columns Dropdown Preview */}
              {showAllColumns && (
                <div className="p-3.5 rounded-2xl border border-border/70 bg-panel/40 space-y-2 animate-fade-in shadow-2xs">
                  <p className="text-[11px] text-muted">
                    Columns that will automatically be generated in your sheet:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-muted text-[11px] font-mono">
                      Timestamp
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-muted text-[11px] font-mono">
                      Lead ID
                    </span>
                    {formFields.map((f) => (
                      <span
                        key={f.id}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-accent/10 border border-accent/25 text-accent text-[11px] font-[700]"
                      >
                        <span>{f.label}</span>
                        {f.required && <span className="text-[10px] opacity-70">*</span>}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-muted text-[11px] font-mono">
                      Lead Score
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-muted text-[11px] font-mono">
                      AI Summary
                    </span>
                  </div>
                </div>
              )}

              {/* Sleek macOS-Style Code Editor Box */}
              <div className="rounded-2xl border border-zinc-800 bg-[#0d1117] overflow-hidden shadow-lg">
                {/* Code Editor Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400 ml-2 font-[600]">
                      Code.gs
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    disabled={!isSheetNamed}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-[700] transition-all shadow-xs ${
                      !isSheetNamed
                        ? "bg-zinc-800/40 border-zinc-700/40 text-zinc-500 cursor-not-allowed opacity-60"
                        : "bg-zinc-800/90 border-zinc-700/80 text-zinc-200 hover:bg-zinc-700 cursor-pointer active:scale-95"
                    }`}
                    title={!isSheetNamed ? "Please click 'I've Named My Sheet' in Step 1 first" : "Copy Google Apps Script"}
                  >
                    {copiedCode ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                    <span>
                      {!isSheetNamed
                        ? "Name Sheet First"
                        : copiedCode
                        ? "Copied Script!"
                        : "Copy Tailored Script"}
                    </span>
                  </button>
                </div>

                <pre className="p-3.5 font-mono text-[11px] sm:text-[11.5px] leading-[1.65] text-zinc-300 max-h-[160px] overflow-auto select-all scrollbar-thin">
                  {appsScriptSnippet}
                </pre>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* STEP 2: DEPLOY AS A WEB APP                                     */}
          {/* ============================================================== */}
          <div className={`space-y-3.5 transition-all duration-300 ${!isSheetNamed ? 'opacity-30 pointer-events-none select-none' : ''}`}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-xs font-[800] shadow-xs">
                2
              </span>
              <h4 className="text-[14.5px] font-[800] text-fg tracking-tight">
                Deploy as a Web App
              </h4>
            </div>

            {/* 4 Clean Deployment Instruction Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl border border-border/80 bg-panel/30 flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panel border border-border text-fg font-[800] text-[10.5px]">
                  1
                </span>
                <p className="leading-snug">
                  Click <b className="text-fg font-[700]">Deploy</b> (top right) ➔ <b className="text-fg font-[700]">New deployment</b>
                </p>
              </div>

              <div className="p-3 rounded-xl border border-border/80 bg-panel/30 flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panel border border-border text-fg font-[800] text-[10.5px]">
                  2
                </span>
                <p className="leading-snug">
                  Click <b className="text-fg font-[700]">⚙️ Gear icon</b> next to <i>Select type</i> ➔ choose <b className="text-fg font-[700]">Web app</b>
                </p>
              </div>

              <div className="p-3 rounded-xl border border-border/80 bg-panel/30 flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panel border border-border text-fg font-[800] text-[10.5px]">
                  3
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Description:</span>
                    <button
                      type="button"
                      onClick={handleCopyDescription}
                      className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline font-[650] cursor-pointer"
                    >
                      {copiedDesc ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedDesc ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="font-[700] text-fg font-mono text-[11.5px] mt-0.5">
                    Ochreshift Leads Sync
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-[800] text-[10.5px]">
                  4
                </span>
                <p className="leading-snug">
                  Execute as: <b className="font-[750]">Me</b><br />
                  Who has access: <b className="font-[750] underline">Anyone ⚠️</b>
                </p>
              </div>
            </div>

            {/* Disambiguation: Which link to copy */}
            <div className="p-4 rounded-2xl border border-border/80 bg-panel/30 text-xs space-y-3">
              <div className="flex items-center gap-2.5 font-[750] text-fg text-[12.5px]">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span>Which link to copy from the Google deployment dialog?</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-[11px]">
                <div className="px-3 py-2.5 rounded-xl bg-red-500/5 border border-red-500/15 text-muted/70 flex items-center justify-between gap-2">
                  <span className="line-through decoration-red-400/50">Deployment ID</span>
                  <span className="text-red-400 text-[10px] font-semibold shrink-0">✕</span>
                </div>
                <div className="px-3 py-2.5 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-[750] flex items-center justify-between gap-2 shadow-sm shadow-emerald-500/10 scale-[1.02]">
                  <span>Web app URL<span className="hidden sm:inline"> (/exec)</span></span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] shrink-0">✓ Copy</span>
                </div>
                <div className="px-3 py-2.5 rounded-xl bg-red-500/5 border border-red-500/15 text-muted/70 flex items-center justify-between gap-2">
                  <span className="line-through decoration-red-400/50">Library URL</span>
                  <span className="text-red-400 text-[10px] font-semibold shrink-0">✕</span>
                </div>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Copy only the link under the <b className="text-fg font-semibold">Web app</b> heading (ends with <code className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">/exec</code>).
              </p>
            </div>
          </div>

          {/* ============================================================== */}
          {/* STEP 3: PASTE WEB APP URL & VERIFY CONNECTION                   */}
          {/* ============================================================== */}
          <div className={`space-y-3.5 pt-1 transition-all duration-300 ${!isSheetNamed ? 'opacity-30 pointer-events-none select-none' : ''}`}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-xs font-[800] shadow-xs">
                3
              </span>
              <h4 className="text-[14.5px] font-[800] text-fg tracking-tight">
                Paste Web App URL &amp; Verify Connection
              </h4>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 sm:py-3 text-[12px] sm:text-[12.5px] font-mono text-fg outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all hover:border-border-strong shadow-xs pr-36"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={!isValidUrl || isTesting || !isSheetNamed}
                  title={!isSheetNamed ? "Please confirm 'I've Named My Sheet' in Step 1 first" : "Send test row to Google Sheet"}
                  className="absolute right-1.5 top-1.5 bottom-1.5 inline-flex items-center gap-1.5 px-3.5 sm:px-4 rounded-lg bg-accent hover:bg-accent-strong text-white font-[750] text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  {isTesting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  ) : (
                    <Zap className="h-3.5 w-3.5 text-white" />
                  )}
                  <span>{isTesting ? "Testing..." : "Send Test Lead"}</span>
                </button>
              </div>

              {/* High-Trust Celebration Card on Successful Verification */}
              {testResult && testResult.ok && (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 space-y-3 animate-fade-in shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-500 text-white shadow-xs shrink-0 mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-[800] text-emerald-950 dark:text-emerald-100 tracking-tight">
                        Live Sync Verified! Test Lead Delivered to Row #2
                      </h5>
                      <p className="text-[12px] opacity-90 mt-0.5 leading-relaxed">
                        A test lead named <b className="font-[750]">"Ochreshift Test Lead"</b> was appended into your spreadsheet.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <span className="text-[11.5px] opacity-90 flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      Switch to your Google Sheet tab right now to see the live row!
                    </span>
                    <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-[750]">
                      Status: Active &amp; Ready
                    </span>
                  </div>
                </div>
              )}

              {/* Failure Banner */}
              {testResult && !testResult.ok && (
                <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                  <div className="flex-1">
                    <p className="font-[750]">Delivery Failed</p>
                    <p className="mt-0.5 text-[11.5px] opacity-90 leading-relaxed">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Historical Backfill Section (Visible when URL exists & there are leads) */}
          {leadsCount > 0 && isValidUrl && (
            <div className="p-4 rounded-2xl border border-border/80 bg-panel/30 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-[750] text-fg">
                    Sync Existing Leads ({leadsCount} leads)
                  </h5>
                  <p className="text-[11.5px] text-muted mt-0.5">
                    Push all leads captured in Ochreshift up to this moment into your spreadsheet with your configured form columns.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBackfill}
                  disabled={isBackfilling}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-panel text-fg font-[700] text-xs transition-all shadow-2xs cursor-pointer disabled:opacity-50 shrink-0 active:scale-95"
                >
                  {isBackfilling ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  ) : (
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  <span>{isBackfilling ? "Syncing..." : "Sync All Existing Leads"}</span>
                </button>
              </div>

              {backfillResult && (
                <p className="text-[11.5px] text-emerald-600 dark:text-emerald-400 font-[700] mt-1">
                  ✅ {backfillResult}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border/60 px-6 sm:px-7 py-4 bg-panel/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-[700] text-muted hover:text-fg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-strong text-white text-xs font-[750] shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span>{isSaving ? "Saving..." : "Save & Enable Sync"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
