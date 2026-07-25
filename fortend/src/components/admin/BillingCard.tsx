"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useSubscription, useCreateStripeCheckout, useCreateRazorpaySubscription } from "@/hooks/useAdmin";
import { AdminApiError, type BillingPlan } from "@/lib/adminApi";
import { loadRazorpayCheckout } from "@/lib/razorpay";

const STATUS_STYLE: Record<string, string> = {
  trialing: "bg-accent/15 text-accent",
  active: "bg-good/15 text-good",
  past_due: "bg-warn/15 text-warn",
  canceled: "bg-bad/15 text-bad",
  expired: "bg-bad/15 text-bad",
  none: "bg-panel text-faint",
};

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const over = used >= max;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[12px]">
        <span className="text-muted">{label}</span>
        <span className={`font-[600] ${over ? "text-bad" : "text-fg"}`}>
          {used} / {max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel">
        <div
          className={`h-full rounded-full ${over ? "bg-bad" : "bg-accent"}`}
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

const PLAN_ORDER: BillingPlan[] = ["starter", "pro", "business", "enterprise"];

const PLAN_INFO: Record<BillingPlan, { label: string; blurb: string }> = {
  starter: { label: "Starter", blurb: "1 bot, core essentials" },
  pro: { label: "Pro", blurb: "5 bots, whitelabel branding" },
  business: { label: "Business", blurb: "25 bots, priority support" },
  enterprise: { label: "Enterprise", blurb: "Custom bot & message volume, dedicated support" },
};

type Region = "india" | "global";

/** Best-effort default so most Indian visitors don't have to flip the
    toggle — always overridable, never the sole gate on which gateway runs. */
function defaultRegion(): Region {
  if (typeof Intl === "undefined") return "global";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Kolkata" ? "india" : "global";
  } catch {
    return "global";
  }
}

export function BillingCard() {
  const { data: sub, isPending } = useSubscription();
  const { data: session } = useSession();
  const [region, setRegion] = useState<Region>(defaultRegion);
  const [pendingPlan, setPendingPlan] = useState<BillingPlan | null>(null);
  const [fallbackPlan, setFallbackPlan] = useState<BillingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stripeCheckout = useCreateStripeCheckout();
  const razorpaySubscription = useCreateRazorpaySubscription();

  async function upgrade(plan: BillingPlan) {
    setError(null);
    setFallbackPlan(null);
    setPendingPlan(plan);
    try {
      if (region === "india") {
        const loaded = await loadRazorpayCheckout();
        // Captured into a local before the next await — TS (correctly)
        // won't keep narrowing a property access like `window.Razorpay`
        // across an `await`, since it can't prove nothing else touched it.
        const Razorpay = window.Razorpay;
        if (!loaded || !Razorpay) {
          setError("Couldn't load Razorpay checkout — check your connection and try again.");
          setPendingPlan(null);
          return;
        }
        const { subscriptionId, keyId } = await razorpaySubscription.mutateAsync(plan);
        const rzp = new Razorpay({
          key: keyId,
          subscription_id: subscriptionId,
          name: "Zeva",
          description: `${PLAN_INFO[plan].label} plan`,
          prefill: { email: session?.user.email, name: session?.user.name },
          theme: { color: "#4f46e5" },
          modal: { ondismiss: () => setPendingPlan(null) },
          handler: () => {
            // Razorpay confirms the charge client-side; our webhook updates
            // `subscriptions` asynchronously (usually within seconds).
            // Reload so the plan/usage above reflects it once it lands.
            window.location.reload();
          },
        });
        rzp.open();
        return; // pendingPlan clears on modal dismiss or the reload above
      }

      const url = await stripeCheckout.mutateAsync({
        plan,
        successUrl: `${window.location.origin}${window.location.pathname}?upgraded=1`,
        cancelUrl: window.location.href,
      });
      window.location.assign(url);
    } catch (e) {
      if (e instanceof AdminApiError && e.status === 400) {
        // Plan has no price/plan id configured in the gateway yet — be
        // honest instead of a checkout button that silently fails.
        setFallbackPlan(plan);
      } else {
        setError(e instanceof Error ? e.message : "Upgrade failed — try again.");
      }
      setPendingPlan(null);
    }
  }

  if (isPending) {
    return (
      <div className="rounded-r2 border border-border bg-surface p-4 shadow-card">
        <span className="text-[13px] text-muted">Loading plan…</span>
      </div>
    );
  }

  if (!sub || sub.status === "none" || !sub.plan) {
    return (
      <div className="rounded-r2 border border-border bg-surface p-4 shadow-card">
        <b className="text-sm font-[750]">Plan</b>
        <p className="mt-1 text-[13px] text-muted">
          No plan yet — create your first bot to start a 14-day trial automatically.
        </p>
      </div>
    );
  }

  const isTrialing = sub.status === "trialing";
  const currentPlan = sub.plan as BillingPlan;

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

      <div className="mt-4 border-t border-border pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <b className="text-[12.5px] font-[700] text-fg">Upgrade plan</b>
          <div className="flex shrink-0 overflow-hidden rounded-full border border-border text-[11px] font-[650]">
            <button
              type="button"
              onClick={() => setRegion("india")}
              className={`px-2.5 py-1 transition-colors ${
                region === "india" ? "bg-accent text-white" : "text-muted hover:text-fg"
              }`}
            >
              India (₹)
            </button>
            <button
              type="button"
              onClick={() => setRegion("global")}
              className={`px-2.5 py-1 transition-colors ${
                region === "global" ? "bg-accent text-white" : "text-muted hover:text-fg"
              }`}
            >
              Global ($)
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {PLAN_ORDER.map((plan) => {
            const info = PLAN_INFO[plan];
            const isCurrent = currentPlan === plan;
            return (
              <div
                key={plan}
                className="flex items-center justify-between gap-3 rounded-r1 border border-border p-2.5"
              >
                <div>
                  <p className="text-[13px] font-[650] text-fg">{info.label}</p>
                  <p className="text-[11.5px] text-muted">{info.blurb}</p>
                </div>
                {isCurrent ? (
                  <span className="shrink-0 text-[11px] font-[650] text-good">Current plan</span>
                ) : (
                  <button
                    type="button"
                    disabled={pendingPlan === plan}
                    onClick={() => upgrade(plan)}
                    className="shrink-0 rounded-r1 border border-border bg-panel px-3 py-1.5 text-[12px] font-[650] text-fg transition-colors hover:border-accent-ring hover:text-accent disabled:opacity-50"
                  >
                    {pendingPlan === plan ? "Opening…" : "Upgrade"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {fallbackPlan && (
          <p className="mt-3 text-[12px] text-muted">
            {PLAN_INFO[fallbackPlan].label} checkout isn&apos;t live yet.{" "}
            <a
              href={`mailto:support@zeva.app?subject=Upgrade%20to%20${encodeURIComponent(PLAN_INFO[fallbackPlan].label)}`}
              className="font-[600] text-accent hover:underline"
            >
              Contact us
            </a>{" "}
            and we&apos;ll set it up.
          </p>
        )}
        {error && <p className="mt-3 text-[12px] text-bad">{error}</p>}
      </div>
    </div>
  );
}
