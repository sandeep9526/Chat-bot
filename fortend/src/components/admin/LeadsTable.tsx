"use client";

import { useState } from "react";
import type { AdminLead } from "@/lib/adminApi";
import { useDeleteLead } from "@/hooks/useAdmin";
import { LEAD_SCORE_STYLE } from "@/lib/leadScore";
import { ConfirmDialog } from "./ConfirmDialog";
import { Users, X, FileSpreadsheet, CheckCircle2, Copy } from "lucide-react";

function toCsv(leads: AdminLead[]): string {
  const head = ["name", "email", "phone", "message", "date"];
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = leads.map((l) =>
    [l.name, l.email, l.phone ?? "", (l.message ?? "").replace(/\s+/g, " "), l.created_at]
      .map(esc)
      .join(","),
  );
  return [head.join(","), ...rows].join("\n");
}

export function LeadsTable({ leads }: { leads: AdminLead[] }) {
  const del = useDeleteLead();
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [confirmDelete, setConfirmDelete] = useState<AdminLead | null>(null);

  const filteredLeads = leads.filter((l) => {
    const matchesScore = scoreFilter === "all" || l.score === scoreFilter;
    const matchesSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.phone && l.phone.includes(search)) ||
      (l.bot_id && l.bot_id.toLowerCase().includes(search.toLowerCase()));
    return matchesScore && matchesSearch;
  });

  const download = () => {
    const blob = new Blob([toCsv(filteredLeads)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
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

  const copyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-r2 border border-border bg-surface shadow-card">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 bg-panel/50">
        <div className="flex items-center gap-3">
          <b className="text-base font-[800]">Leads ({filteredLeads.length})</b>
          <div className="flex items-center rounded-r1 border border-border bg-surface p-0.5 text-xs">
            {(["all", "hot", "warm", "cold"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScoreFilter(s)}
                aria-pressed={scoreFilter === s}
                className={`px-2.5 py-1 rounded-r1 font-[650] capitalize cursor-pointer transition-colors ${
                  scoreFilter === s ? "bg-accent text-white shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search name, email, phone..."
            aria-label="Search leads"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 rounded-r1 border border-border bg-surface px-3 py-1.5 text-xs text-fg outline-none focus:border-accent"
          />
          <button
            type="button"
            className="cursor-pointer rounded-r1 border border-border bg-surface px-3 py-1.5 font-ui text-xs font-[600] text-accent hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
            onClick={() => setShowSheetsModal(true)}
          >
            Google Sheets sync
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-r1 border border-border bg-surface px-3 py-1.5 font-ui text-xs font-[600] text-fg hover:border-accent focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
            onClick={download}
            disabled={filteredLeads.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      {showSheetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowSheetsModal(false)}
          />

          {/* Modal */}
          <div className="relative flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-2xl border border-border bg-surface p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
            <button
              onClick={() => setShowSheetsModal(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-panel hover:text-fg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" style={{ animationDuration: '3s' }} />
              <FileSpreadsheet className="h-10 w-10 text-emerald-500" />
            </div>

            <h2 className="mb-2 text-center text-xl font-bold tracking-tight text-fg">
              Connect Google Sheets
            </h2>

            <p className="mb-6 text-center text-[13.5px] leading-relaxed text-muted">
              Sync your captured leads directly to a Google Spreadsheet in real-time using our Apps Script integration.
            </p>

            <div className="w-full space-y-4">
              <div className="flex items-start gap-3 w-full">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-[750] text-white shadow-sm mt-0.5">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <b className="block text-[13px] text-fg">Create an Apps Script</b>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted">Open your spreadsheet, click <b className="text-fg">Extensions &gt; Apps Script</b>, and paste this code:</p>
                  
                  <div className="mt-3 w-full overflow-hidden rounded-xl border border-zinc-800 bg-[#0d1117] shadow-xl">
                    <div className="flex items-center justify-between border-b border-zinc-800 bg-[#161b22] px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
                        <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
                        <div className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
                        <span className="ml-2 font-mono text-[10px] font-medium text-zinc-400">Code.gs</span>
                      </div>
                      <button
                        type="button"
                        onClick={copyScript}
                        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] font-[600] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        {copied ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="relative w-full overflow-x-auto">
                      <pre className="p-4 font-mono text-[11.5px] leading-[1.6] text-zinc-300 max-h-[220px] min-w-max">
                        {appsScriptCode}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 w-full">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-[750] text-white shadow-sm mt-0.5">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <b className="block text-[13px] text-fg">Deploy & Connect</b>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                    Click <b className="text-fg">Deploy &gt; New Deployment</b>. Set type to <b className="text-fg">Web app</b>, execute as <b className="text-fg">Me</b>, and access to <b className="text-fg">Anyone</b>. Copy the resulting URL.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSheetsModal(false)}
              className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-panel border border-border px-6 text-[14px] font-[650] text-fg transition-all hover:bg-surface active:scale-[0.98]"
            >
              Close instructions
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-[.08em] text-faint border-b border-border bg-panel/30">
              <th className="px-5 py-3 font-[750]">Bot ID</th>
              <th className="px-5 py-3 font-[750]">Name</th>
              <th className="px-5 py-3 font-[750]">Email</th>
              <th className="px-5 py-3 font-[750]">Phone</th>
              <th className="px-5 py-3 font-[750]">Date</th>
              <th className="px-5 py-3 font-[750]">Score</th>
              <th className="px-5 py-3 font-[750] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent">
                      <Users className="h-6 w-6" />
                    </div>
                    <h4 className="text-[14px] font-[700] text-fg">No leads found</h4>
                    <p className="mt-1 max-w-[250px] text-[13px] text-muted">Test your agent in Studio or the widget to capture your first lead!</p>
                  </div>
                </td>
              </tr>
            )}
            {filteredLeads.map((l) => (
              <tr key={l.id} className="group border-t border-border/60 hover:bg-panel/60 transition-all hover:shadow-[inset_2px_0_0_var(--accent)]">
                <td className="px-5 py-3.5 font-mono text-[11.5px] font-[650] text-accent/80 group-hover:text-accent transition-colors">{l.bot_id || "—"}</td>
                <td className="px-5 py-3.5 font-[650] text-fg">{l.name}</td>
                <td className="px-5 py-3.5 text-muted">{l.email}</td>
                <td className="px-5 py-3.5 text-muted">{l.phone || "—"}</td>
                <td className="px-5 py-3.5 text-[12px] font-[500] text-faint">
                  {l.created_at ? new Date(l.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : "—"}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-[750] uppercase ${
                      LEAD_SCORE_STYLE[l.score] ?? LEAD_SCORE_STYLE.cold
                    }`}
                  >
                    {l.score}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(l)}
                    disabled={del.isPending}
                    className="tap cursor-pointer rounded-r1 px-2.5 py-1 text-[11.5px] font-[600] text-bad hover:bg-bad/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}

