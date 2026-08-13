"use client";

import { useState } from "react";
import type { AdminLead } from "@/lib/adminApi";
import { useDeleteLead } from "@/hooks/useAdmin";
import { LEAD_SCORE_STYLE } from "@/lib/leadScore";
import { ConfirmDialog } from "./ConfirmDialog";

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
        <div className="border-b border-border bg-panel p-5 text-[13px]">
          <div className="flex items-center justify-between mb-2">
            <b className="text-fg font-[700]">Google Sheets real-time sync setup</b>
            <button
              type="button"
              className="text-xs text-muted hover:text-fg font-[600]"
              onClick={() => setShowSheetsModal(false)}
            >
              Close
            </button>
          </div>
          <ol className="list-decimal pl-5 text-muted space-y-1.5 text-[12.5px]">
            <li>Open your Google Sheet → Go to <b>Extensions &gt; Apps Script</b>.</li>
            <li>Paste the Google Apps Script code snippet below and click <b>Deploy &gt; New Deployment</b>.</li>
            <li>Choose type <b>Web app</b> → Execute as <b>Me</b> → Who has access <b>Anyone</b>.</li>
            <li>Copy the Web App URL and paste it into Studio under <b>Channels &amp; Integrations &gt; Google Sheets Sync</b>.</li>
          </ol>
          <div className="mt-3 relative">
            <pre className="p-3 bg-surface border border-border rounded-r1 font-mono text-[11px] overflow-x-auto text-fg">
              {appsScriptCode}
            </pre>
            <button
              type="button"
              onClick={copyScript}
              className="absolute top-2 right-2 px-2.5 py-1 text-[11px] font-[600] rounded-r1 bg-accent text-white hover:opacity-90 transition-opacity"
            >
              {copied ? "Copied" : "Copy code"}
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
                <td colSpan={7} className="px-5 py-10 text-center text-muted">
                  No leads found. Test the agent in Studio or widget to capture your first lead!
                </td>
              </tr>
            )}
            {filteredLeads.map((l) => (
              <tr key={l.id} className="border-t border-border/60 hover:bg-panel/40 transition-colors">
                <td className="px-5 py-3 font-mono text-[11.5px] font-[650] text-accent">{l.bot_id || "—"}</td>
                <td className="px-5 py-3 font-[650] text-fg">{l.name}</td>
                <td className="px-5 py-3 text-muted">{l.email}</td>
                <td className="px-5 py-3 text-muted">{l.phone || "—"}</td>
                <td className="px-5 py-3 font-mono text-[11.5px] text-faint">
                  {l.created_at?.slice(0, 16)}
                </td>
                <td className="px-5 py-3">
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

