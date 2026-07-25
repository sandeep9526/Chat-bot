import type { AdminLead } from "@/lib/adminApi";

/** Shared badge styling for a lead's hot/warm/cold score — kept in one place
 *  so the dashboard overview and the leads table can't drift apart. */
export const LEAD_SCORE_STYLE: Record<AdminLead["score"], string> = {
  hot: "bg-bad/15 text-bad",
  warm: "bg-warn/15 text-warn",
  cold: "bg-panel text-faint",
};
