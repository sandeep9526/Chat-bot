"use client";

import { useSubscription } from "@/hooks/useAdmin";

const STATUS_STYLE: Record<string, string> = {
  trialing: "bg-accent/15 text-accent",
  active: "bg-good/15 text-good",
  past_due: "bg-amber-500/15 text-amber-600",
  canceled: "bg-red-500/15 text-red-500",
  expired: "bg-red-500/15 text-red-500",
  none: "bg-panel text-faint",
};

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const over = used >= max;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[12px]">
        <span className="text-muted">{label}</span>
        <span className={`font-[600] ${over ? "text-red-500" : "text-fg"}`}>
          {used} / {max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel">
        <div
          className={`h-full rounded-full ${over ? "bg-red-500" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function BillingCard() {
  const { data: sub, isPending } = useSubscription();

  if (isPending) {
    return (
      <div className="rounded-r2 border border-border bg-surface p-4 shadow-panel">
        <span className="text-[13px] text-muted">Loading plan…</span>
      </div>
    );
  }

  if (!sub || sub.status === "none" || !sub.plan) {
    return (
      <div className="rounded-r2 border border-border bg-surface p-4 shadow-panel">
        <b className="text-sm font-[750]">Plan</b>
        <p className="mt-1 text-[13px] text-muted">
          No plan yet — create your first bot to start a 14-day trial automatically.
        </p>
      </div>
    );
  }

  const isTrialing = sub.status === "trialing";

  return (
    <div className="rounded-r2 border border-border bg-surface p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <b className="text-sm font-[750]">Plan</b>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-[700] uppercase ${
            STATUS_STYLE[sub.status] ?? STATUS_STYLE.none
          }`}
        >
          {sub.status}
        </span>
      </div>

      <p className="mt-1 text-[15px] font-[700] capitalize text-fg">{sub.plan}</p>
      <p className="mt-0.5 text-[12px] text-muted">
        {isTrialing
          ? `Trial ends ${formatDate(sub.trial_ends_at)}`
          : sub.current_period_end
            ? `Renews ${formatDate(sub.current_period_end)}`
            : null}
      </p>

      <div className="mt-3 flex flex-col gap-2.5">
        <UsageBar label="Bots" used={sub.bots_used ?? 0} max={sub.max_bots ?? 0} />
        <UsageBar
          label="Messages this month"
          used={sub.messages_this_month ?? 0}
          max={sub.max_messages_per_month ?? 0}
        />
      </div>

      {/* No real checkout exists yet (no Paddle account is connected) — be
          honest about that rather than a button that pretends to work. */}
      <a
        href="mailto:contact@prepvia.com?subject=Upgrade%20my%20Zeva%20plan"
        className="mt-3 inline-block text-[12px] font-[600] text-accent hover:underline"
      >
        Want a higher limit? Contact us →
      </a>
    </div>
  );
}
