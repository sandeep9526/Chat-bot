import type { AdminLead } from "@/lib/adminApi";

/** Shared badge styling for a lead's hot/warm/cold score — kept in one place
 *  so the dashboard overview and the leads table can't drift apart. */
export const LEAD_SCORE_STYLE: Record<string, string> = {
  hot: "bg-bad/15 text-bad border border-bad/30",
  warm: "bg-warn/15 text-warn border border-warn/30",
  cold: "bg-panel text-faint border border-border",
  test: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30",
};
