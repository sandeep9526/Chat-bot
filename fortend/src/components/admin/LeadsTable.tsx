"use client";

import type { AdminLead } from "@/lib/adminApi";
import { useDeleteLead } from "@/hooks/useAdmin";

/** Badge style for the backend's hot/warm/cold lead score (Phase 05). */
const SCORE_STYLE: Record<AdminLead["score"], string> = {
  hot: "bg-[color-mix(in_srgb,#ef4444_16%,transparent)] text-red-500",
  warm: "bg-[color-mix(in_srgb,#f59e0b_18%,transparent)] text-amber-600",
  cold: "bg-panel text-faint",
};

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

  const onDelete = (lead: AdminLead) => {
    if (!window.confirm(`Delete ${lead.name}'s lead (${lead.email})? This can't be undone.`)) return;
    del.mutate(lead.id);
  };

  const download = () => {
    const blob = new Blob([toCsv(leads)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-hidden rounded-r2 border border-border bg-surface shadow-panel">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <b className="text-sm font-[750]">Leads ({leads.length})</b>
        <button
          type="button"
          className="cursor-pointer rounded-[8px] border border-border bg-panel px-3 py-1.5 font-ui text-xs font-[600] text-fg hover:border-accent focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
          onClick={download}
          disabled={leads.length === 0}
        >
          Download CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-[.08em] text-faint">
              <th className="px-4 py-2 font-[700]">Name</th>
              <th className="px-4 py-2 font-[700]">Email</th>
              <th className="px-4 py-2 font-[700]">Phone</th>
              <th className="px-4 py-2 font-[700]">Date</th>
              <th className="px-4 py-2 font-[700]">Score</th>
              <th className="px-4 py-2 font-[700]" />
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Abhi koi lead nahi. Widget me lead ticket bharo → yahan aayegi.
                </td>
              </tr>
            )}
            {leads.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-4 py-2.5 font-[600] text-fg">{l.name}</td>
                <td className="px-4 py-2.5 text-muted">{l.email}</td>
                <td className="px-4 py-2.5 text-muted">{l.phone || "—"}</td>
                <td className="px-4 py-2.5 font-mono text-[11.5px] text-faint">
                  {l.created_at?.slice(0, 16)}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-[700] uppercase ${
                      SCORE_STYLE[l.score] ?? SCORE_STYLE.cold
                    }`}
                  >
                    {l.score}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(l)}
                    disabled={del.isPending}
                    className="cursor-pointer rounded-[6px] px-2 py-1 text-[11.5px] font-[600] text-red-500 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
