"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import {
  useSubscription,
  useCreateStripeCheckout,
  useCreateStripePortalSession,
  useCreateRazorpaySubscription,
  useCancelRazorpaySubscription,
  useDowngradeToFree,
} from "@/hooks/useAdmin";
import {
  AdminApiError,
  verifyRazorpayPayment,
  type BillingPlan,
  type BillingInterval,
} from "@/lib/adminApi";
import { loadRazorpayCheckout } from "@/lib/razorpay";
import { cn } from "@/lib/cn";
import { AlertTriangle, Sparkles, ExternalLink, ShieldCheck, Check, Zap } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  trialing: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  past_due: "bg-red-500/10 text-red-500 border-red-500/20",
  canceled: "bg-red-500/10 text-red-500 border-red-500/20",
  expired: "bg-red-500/10 text-red-500 border-red-500/20",
  none: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const over = used >= max;
  return (
    <div className="flex-1 min-w-[200px]">
      <div className="mb-2 flex items-baseline justify-between text-[13px]">
        <span className="text-muted font-[500]">{label}</span>
        <span className={cn("font-[750]", over ? "text-bad" : "text-fg")}>
          {used} <span className="text-muted font-[500]">/ {max}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-hover border border-border">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            over ? "bg-bad" : pct > 80 ? "bg-orange-500" : "bg-accent"
          )}
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

type Region = "india" | "global";

function defaultRegion(): Region {
  return "india";
}

export function BillingCard() {
  const { data: sub, isPending } = useSubscription();
  const { data: session } = useSession();
  const [region, setRegion] = useState<Region>(defaultRegion);
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [pendingPlan, setPendingPlan] = useState<BillingPlan | null>(null);
  const [fallbackPlan, setFallbackPlan] = useState<BillingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [downgradeConfirm, setDowngradeConfirm] = useState(false);

  const stripeCheckout = useCreateStripeCheckout();
  const stripePortal = useCreateStripePortalSession();
  const razorpaySubscription = useCreateRazorpaySubscription();
  const cancelRazorpay = useCancelRazorpaySubscription();
  const downgradeMutation = useDowngradeToFree();
  const queryClient = useQueryClient();

  const isAnnual = interval === "year";

  const PLAN_INFO: Record<
    BillingPlan,
    {
      label: string;
      blurb: string;
      priceUsd: string;
      subUsd?: string;
      priceInr: string;
      subInr?: string;
      features: string[];
    }
  > = {
    free: {
      label: "Free",
      blurb: "Forever free tier to get started.",
      priceUsd: "$0",
      priceInr: "₹0",
      features: ["1 AI Chatbot", "50 Messages/mo", "Ochreshift Watermark", "Community Support"],
    },
    starter: {
      label: "Starter",
      blurb: "Essential tools for small teams & salons.",
      priceUsd: isAnnual ? "$190" : "$19",
      subUsd: isAnnual ? "$15.83/mo billed annually" : undefined,
      priceInr: isAnnual ? "₹14,990" : "₹1,499",
      subInr: isAnnual ? "₹1,249/mo billed annually" : undefined,
      features: ["1 AI Chatbot", "2,000 Messages/mo", "Basic Analytics", "Standard Support"],
    },
    pro: {
      label: "Pro",
      blurb: "High volume, lead scoring & white-labeling.",
      priceUsd: isAnnual ? "$470" : "$49",
      subUsd: isAnnual ? "$39.17/mo billed annually" : undefined,
      priceInr: isAnnual ? "₹39,990" : "₹3,999",
      subInr: isAnnual ? "₹3,332/mo billed annually" : undefined,
      features: [
        "5 AI Chatbots",
        "10,000 Messages/mo",
        "Remove 'Powered by' Branding",
        "WhatsApp & Lead Forms",
        "Priority Support",
      ],
    },
    business: {
      label: "Business",
      blurb: "For multi-location & growing teams.",
      priceUsd: isAnnual ? "$950" : "$99",
      subUsd: isAnnual ? "$79.17/mo billed annually" : undefined,
      priceInr: isAnnual ? "₹79,990" : "₹7,999",
      subInr: isAnnual ? "₹6,665/mo billed annually" : undefined,
      features: [
        "25 AI Chatbots",
        "50,000 Messages/mo",
        "Advanced Analytics & CRM export",
        "Full Custom Branding",
        "Dedicated Account Manager",
      ],
    },
    enterprise: {
      label: "Enterprise",
      blurb: "Custom scale, SLA, and integrations.",
      priceUsd: "Custom",
      priceInr: "Custom",
      features: [
        "100+ AI Chatbots",
        "250,000+ Messages/mo",
        "Custom API & CRM Integrations",
        "24/7 Phone Support & SLA",
      ],
    },
  };

  async function upgrade(plan: BillingPlan) {
    setError(null);
    setFallbackPlan(null);

    if (plan === "enterprise") {
      window.location.href = "mailto:sales@ochreshift.in?subject=Enterprise%20Tier%20Inquiry";
      return;
    }

    setPendingPlan(plan);
    try {
      if (region === "india") {
        const loaded = await loadRazorpayCheckout();
        const Razorpay = window.Razorpay;
        if (!loaded || !Razorpay) {
          setError("Couldn't load Razorpay checkout — check your connection and try again.");
          setPendingPlan(null);
          return;
        }
        const { subscriptionId, keyId } = await razorpaySubscription.mutateAsync({
          plan,
          interval,
        });
        const rzp = new Razorpay({
          key: keyId,
          subscription_id: subscriptionId,
          name: "Ochreshift",
          description: `${PLAN_INFO[plan].label} plan (${interval === "year" ? "Annual" : "Monthly"})`,
          prefill: { email: session?.user.email, name: session?.user.name },
          theme: { color: "#4f46e5" },
          modal: { ondismiss: () => setPendingPlan(null) },
          handler: (response: unknown) => {
            const res = response as {
              razorpay_payment_id?: string;
              razorpay_subscription_id?: string;
              razorpay_signature?: string;
            };
            if (res?.razorpay_payment_id && res?.razorpay_signature) {
              void verifyRazorpayPayment({
                subscriptionId: res.razorpay_subscription_id || subscriptionId,
                paymentId: res.razorpay_payment_id,
                signature: res.razorpay_signature,
              })
                .catch((err) => {
                  console.warn("Payment verification notice:", err);
                })
                .finally(() => {
                  void queryClient.invalidateQueries({ queryKey: ["admin", "subscription"] });
                  setPendingPlan(null);
                });
            } else {
              void queryClient.invalidateQueries({ queryKey: ["admin", "subscription"] });
              setPendingPlan(null);
            }
          },
        });
        rzp.open();
        return;
      }

      const url = await stripeCheckout.mutateAsync({
        plan,
        interval,
        successUrl: `${window.location.origin}${window.location.pathname}?upgraded=1`,
        cancelUrl: window.location.href,
      });
      window.location.assign(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upgrade failed — try again.";
      if (msg.toLowerCase().includes("provisioned") || msg.toLowerCase().includes("provisioning")) {
        setFallbackPlan(plan);
      } else if (msg.toLowerCase().includes("already")) {
        setError("You are already subscribed to this plan.");
      } else {
        setError(msg);
      }
      setPendingPlan(null);
    }
  }

  async function openStripePortal() {
    setError(null);
    setPortalLoading(true);
    try {
      const url = await stripePortal.mutateAsync(window.location.href);
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to open billing portal.");
      setPortalLoading(false);
    }
  }

  async function handleDowngrade() {
    setError(null);
    try {
      if (sub?.gateway === "razorpay") {
        await cancelRazorpay.mutateAsync();
      } else {
        await downgradeMutation.mutateAsync();
      }
      setDowngradeConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to downgrade plan.");
    }
  }

  if (isPending) {
    return (
      <div className="w-full h-40 rounded-2xl border border-border bg-surface flex items-center justify-center">
        <span className="text-[14px] font-[500] text-muted animate-pulse">Loading billing details...</span>
      </div>
    );
  }

  const isTrialing = sub?.status === "trialing";
  const currentPlan = (sub?.plan || "free") as BillingPlan | "trial";
  const isPaidPlan = currentPlan === "starter" || currentPlan === "pro" || currentPlan === "business" || currentPlan === "enterprise";
  const usagePercentMsgs = sub?.usage_percent_messages ?? 0;
  const isNearingLimit = usagePercentMsgs >= 80;

  const nextPlan: BillingPlan =
    currentPlan === "free" || currentPlan === "trial"
      ? "starter"
      : currentPlan === "starter"
      ? "pro"
      : currentPlan === "pro"
      ? "business"
      : "enterprise";
  const nextPlanLabel = PLAN_INFO[nextPlan]?.label || "Pro";

  return (
    <div className="w-full animate-fade-in flex flex-col gap-8">
      {/* USAGE NUDGE ALERT (Loss Aversion Trigger) */}
      {isNearingLimit && (
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-[15px] font-[750] text-fg">
                Approaching Monthly Message Limit ({usagePercentMsgs}% Used)
              </h4>
              <p className="text-[13px] text-muted mt-0.5">
                Your bots have used {sub?.messages_this_month} of {sub?.max_messages_per_month} messages. Upgrade to prevent chat downtime.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => upgrade(nextPlan)}
            className="px-4 py-2 rounded-xl bg-accent text-white text-[13px] font-[750] hover:bg-accent-hover transition shadow-sm shrink-0 inline-flex items-center gap-1.5"
          >
            <Zap className="h-4 w-4" />
            <span>Upgrade to {nextPlanLabel}</span>
          </button>
        </div>
      )}

      {/* SECTION A: Current Plan & Usage Dashboard */}
      <div className="rounded-2xl border border-border bg-surface/50 shadow-sm overflow-hidden backdrop-blur-sm relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-[800] text-fg tracking-tight">
                {!sub || sub.status === "none" || !sub.plan
                  ? "No Active Plan"
                  : currentPlan === "trial"
                    ? "14-Day Pro Trial Active"
                    : currentPlan === "free"
                      ? "Forever-Free Plan"
                      : PLAN_INFO[currentPlan as BillingPlan]?.label + " Plan"}
              </h2>
              {sub && sub.status !== "none" && (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 border font-mono text-[11px] font-[700] uppercase tracking-wider flex items-center gap-1.5",
                    STATUS_STYLE[sub.status] ?? STATUS_STYLE.none
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                  {sub.status}
                </span>
              )}
            </div>
            <p className="text-[13px] text-muted max-w-xl leading-relaxed">
              {!sub || sub.status === "none" || !sub.plan
                ? "Create your first agent to start your 14-day Pro trial automatically."
                : isTrialing
                  ? `Your trial has ${sub.days_left_in_trial ?? 0} days remaining (ends ${formatDate(sub.trial_ends_at)}). Enjoy full Pro features (5 bots, 10,000 msgs).`
                  : currentPlan === "free"
                    ? "You are on the Forever-Free tier (1 bot, 50 msgs/mo with watermark). Upgrade anytime to scale your conversations."
                    : sub.cancel_at_period_end
                      ? `Your subscription will end on ${formatDate(sub.current_period_end)}. You will keep full access until then, after which your account transitions to the Free tier.`
                      : sub.current_period_end
                        ? `Your subscription renews automatically on ${formatDate(sub.current_period_end)}.`
                        : "Active plan subscription."}
            </p>

            {/* Self-serve billing management actions */}
            <div className="flex items-center gap-4 mt-2">
              {sub?.stripe_customer_id && (
                <button
                  type="button"
                  disabled={portalLoading}
                  onClick={openStripePortal}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-[650] text-accent hover:underline cursor-pointer"
                >
                  <span>{portalLoading ? "Opening..." : "Manage Invoices & Cards (Stripe)"}</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}

              {isPaidPlan && !sub?.cancel_at_period_end && (
                <button
                  type="button"
                  onClick={() => setDowngradeConfirm(true)}
                  className="text-[12.5px] font-[600] text-muted hover:text-red-500 transition cursor-pointer"
                >
                  {sub?.gateway === "razorpay" ? "Cancel Razorpay Subscription" : "Downgrade to Free"}
                </button>
              )}

              {isPaidPlan && sub?.cancel_at_period_end && (
                <span className="text-[12px] font-[600] text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                  Cancellation scheduled for period end
                </span>
              )}
            </div>
          </div>

          {sub && sub.status !== "none" && (
            <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto md:min-w-[400px]">
              <UsageBar label="Bots Deployed" used={sub.bots_used ?? 0} max={sub.max_bots ?? 0} />
              <UsageBar
                label="Messages This Month"
                used={sub.messages_this_month ?? 0}
                max={sub.max_messages_per_month ?? 0}
              />
            </div>
          )}
        </div>

        {/* Downgrade confirmation prompt */}
        {downgradeConfirm && (
          <div className="border-t border-border bg-surface-hover/50 p-4 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="text-[13px] text-fg/90">
              Are you sure you want to cancel your plan? Your recurring billing will be canceled with the gateway, and your account will transition to the <strong>Forever-Free plan</strong> (1 bot, 50 msgs/mo).
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDowngradeConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-[12.5px] font-[600] text-muted hover:text-fg transition"
              >
                Keep Current Plan
              </button>
              <button
                type="button"
                disabled={downgradeMutation.isPending}
                onClick={handleDowngrade}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[12.5px] font-[700] hover:bg-red-600 transition"
              >
                {downgradeMutation.isPending ? "Downgrading..." : "Confirm Downgrade"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION B: Pricing Controls & Plans */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-[20px] font-[800] text-fg tracking-tight">Select your growth tier</h3>
            <p className="text-[13px] text-muted mt-1">Upgrade or modify your plan anytime. Zero lock-in.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Monthly / Annual Billing Toggle */}
            <div className="flex p-1 bg-surface-hover rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setInterval("month")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[12.5px] font-[700] transition-all duration-200",
                  interval === "month"
                    ? "bg-surface text-fg shadow-sm border border-border"
                    : "text-muted hover:text-fg border border-transparent"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setInterval("year")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[12.5px] font-[700] transition-all duration-200 flex items-center gap-1.5",
                  interval === "year"
                    ? "bg-surface text-fg shadow-sm border border-border"
                    : "text-muted hover:text-fg border border-transparent"
                )}
              >
                <span>Annual</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-[800] tracking-wide uppercase">
                  Save 20%
                </span>
              </button>
            </div>

            {/* Region Switcher removed — everyone gets Razorpay INR */}
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLAN_ORDER.map((plan) => {
            const info = PLAN_INFO[plan];
            const isCurrent = currentPlan === plan && sub?.status !== "none";
            const isBusiness = plan === "business";

            return (
              <div
                key={plan}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-surface transition-all duration-300",
                  isBusiness
                    ? "border-accent shadow-[0_0_30px_-10px_rgba(var(--accent-rgb),0.3)] scale-[1.02] lg:scale-[1.03] z-10"
                    : "border-border hover:border-border-strong hover:-translate-y-1"
                )}
              >
                {isBusiness && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-[800] uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md whitespace-nowrap flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Most Popular</span>
                  </div>
                )}

                <div className="p-6 border-b border-border flex flex-col gap-1">
                  <h4 className="text-[18px] font-[800] text-fg">{info.label}</h4>
                  <p className="text-[13px] text-muted h-10 leading-snug">{info.blurb}</p>

                  <div className="mt-4 flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[32px] font-[800] tracking-tight text-fg">
                        {region === "india" ? info.priceInr : info.priceUsd}
                      </span>
                      {plan !== "enterprise" && (
                        <span className="text-[13px] font-[500] text-muted">
                          {isAnnual ? "" : "/mo"}
                        </span>
                      )}
                    </div>
                    {isAnnual && (
                      <span className="text-[11.5px] font-[600] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {region === "india" ? info.subInr : info.subUsd}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-6 justify-between">
                  <ul className="flex flex-col gap-3">
                    {info.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px] text-fg/80 leading-relaxed">
                        <div className="h-4 w-4 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl border border-accent bg-accent/10 text-accent text-[13px] font-[750] transition-colors cursor-default inline-flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Current Plan</span>
                    </button>
                  ) : plan === "enterprise" ? (
                    <a
                      href="mailto:sales@ochreshift.in?subject=Enterprise%20Plan%20Inquiry"
                      className="w-full py-2.5 rounded-xl text-[13px] font-[750] transition-all duration-200 bg-surface-hover text-fg border border-border hover:border-fg/30 hover:bg-fg hover:text-bg text-center block"
                    >
                      Contact Sales
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled={pendingPlan === plan}
                      onClick={() => upgrade(plan)}
                      className={cn(
                        "w-full py-2.5 rounded-xl text-[13px] font-[750] transition-all duration-200",
                        isBusiness
                          ? "bg-accent text-white hover:bg-accent-hover shadow-md hover:shadow-lg"
                          : "bg-surface-hover text-fg border border-border hover:border-fg/30 hover:bg-fg hover:text-bg",
                        pendingPlan === plan && "opacity-50 cursor-wait"
                      )}
                    >
                      {pendingPlan === plan ? "Processing..." : `Upgrade to ${info.label}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Fallback Notice */}
        {fallbackPlan && (
          <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 items-start">
            <div className="text-[13px] text-blue-500/90 leading-relaxed">
              The <strong>{PLAN_INFO[fallbackPlan].label}</strong> self-serve checkout is being customized for your region.{" "}
              <a
                href={`mailto:support@ochreshift.in?subject=Upgrade%20to%20${encodeURIComponent(PLAN_INFO[fallbackPlan].label)}`}
                className="font-[700] hover:underline"
              >
                Contact our team directly
              </a>{" "}
              for immediate manual activation.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-[13px] text-red-500 font-[500]">
            {error}
          </div>
        )}

        {/* Footer info & supported payment logos */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-muted text-center md:text-left leading-relaxed">
            All subscriptions include automated updates, secure vector storage, and 99.9% uptime. You agree to our{" "}
            <a href="/terms" target="_blank" className="text-accent hover:underline font-[500]">Terms</a>,{" "}
            <a href="/privacy" target="_blank" className="text-accent hover:underline font-[500]">Privacy</a>, and{" "}
            <a href="/refund-policy" target="_blank" className="text-accent hover:underline font-[500]">Refund Policy</a>.
          </p>
          <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
              alt="Stripe"
              className="h-4"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg"
              alt="Razorpay"
              className="h-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
