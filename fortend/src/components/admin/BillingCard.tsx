"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useSubscription, useCreateStripeCheckout, useCreateRazorpaySubscription } from "@/hooks/useAdmin";
import { AdminApiError, type BillingPlan } from "@/lib/adminApi";
import { loadRazorpayCheckout } from "@/lib/razorpay";
import { cn } from "@/lib/cn";

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

const PLAN_INFO: Record<BillingPlan, { label: string; blurb: string; priceUsd: string; priceInr: string; features: string[] }> = {
  starter: { 
    label: "Starter", 
    blurb: "Essential tools for small teams.", 
    priceUsd: "$19", priceInr: "₹1,499",
    features: ["1 Chatbot", "1,000 Messages/mo", "Basic Analytics", "Standard Support"]
  },
  pro: { 
    label: "Pro", 
    blurb: "Advanced features and branding.", 
    priceUsd: "$49", priceInr: "₹3,999",
    features: ["5 Chatbots", "5,000 Messages/mo", "Remove 'Powered by' Branding", "Priority Support"]
  },
  business: { 
    label: "Business", 
    blurb: "For growing businesses.", 
    priceUsd: "$99", priceInr: "₹7,999",
    features: ["25 Chatbots", "25,000 Messages/mo", "Advanced Analytics", "Dedicated Account Manager"]
  },
  enterprise: { 
    label: "Enterprise", 
    blurb: "Custom scale and integrations.", 
    priceUsd: "Custom", priceInr: "Custom",
    features: ["Unlimited Chatbots", "Unlimited Messages", "Custom API Integrations", "24/7 Phone Support"]
  },
};

type Region = "india" | "global";

function defaultRegion(): Region {
  if (typeof Intl === "undefined") return "global";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Kolkata" ? "india" : "global";
  } catch {
    return "global";
  }
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-accent shrink-0">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
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
          name: "ochreshift",
          description: `${PLAN_INFO[plan].label} plan`,
          prefill: { email: session?.user.email, name: session?.user.name },
          theme: { color: "#4f46e5" },
          modal: { ondismiss: () => setPendingPlan(null) },
          handler: () => {
            window.location.reload();
          },
        });
        rzp.open();
        return;
      }

      const url = await stripeCheckout.mutateAsync({
        plan,
        successUrl: `${window.location.origin}${window.location.pathname}?upgraded=1`,
        cancelUrl: window.location.href,
      });
      window.location.assign(url);
    } catch (e) {
      if (e instanceof AdminApiError && e.status === 400) {
        setFallbackPlan(plan);
      } else {
        setError(e instanceof Error ? e.message : "Upgrade failed — try again.");
      }
      setPendingPlan(null);
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
  const currentPlan = sub?.plan as BillingPlan | "trial";

  return (
    <div className="w-full animate-fade-in flex flex-col gap-8">
      
      {/* SECTION A: Current Plan & Usage Dashboard */}
      <div className="rounded-2xl border border-border bg-surface/50 shadow-sm overflow-hidden backdrop-blur-sm relative">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
        
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-[800] text-fg tracking-tight">
                {!sub || sub.status === "none" || !sub.plan 
                  ? "No active plan" 
                  : currentPlan === "trial" 
                    ? "Free Trial" 
                    : PLAN_INFO[currentPlan as BillingPlan]?.label + " Plan"}
              </h2>
              {sub && sub.status !== "none" && (
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 border font-mono text-[11px] font-[700] uppercase tracking-wider flex items-center gap-1.5",
                  STATUS_STYLE[sub.status] ?? STATUS_STYLE.none
                )}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                  {sub.status}
                </span>
              )}
            </div>
            <p className="text-[13px] text-muted">
              {!sub || sub.status === "none" || !sub.plan 
                ? "Create your first agent to start a 14-day trial automatically."
                : isTrialing
                  ? `Your trial ends on ${formatDate(sub.trial_ends_at)}. Upgrade now to prevent interruption.`
                  : sub.current_period_end
                    ? `Your subscription will automatically renew on ${formatDate(sub.current_period_end)}.`
                    : "Active subscription."}
            </p>
          </div>

          {(sub && sub.status !== "none") && (
            <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto md:min-w-[400px]">
              <UsageBar label="Bots Deployed" used={sub.bots_used ?? 0} max={sub.max_bots ?? 0} />
              <UsageBar label="Messages This Month" used={sub.messages_this_month ?? 0} max={sub.max_messages_per_month ?? 0} />
            </div>
          )}
        </div>
      </div>

      {/* SECTION B: Premium Pricing Grid */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-[18px] font-[800] text-fg">Upgrade your plan</h3>
            <p className="text-[13px] text-muted mt-1">Scale your agents as your business grows.</p>
          </div>
          
          <div className="flex p-1 bg-surface-hover rounded-lg border border-border shrink-0">
            <button
              type="button"
              onClick={() => setRegion("global")}
              className={cn(
                "px-4 py-1.5 rounded-md text-[13px] font-[650] transition-all duration-300",
                region === "global" ? "bg-surface text-fg shadow-sm border border-border" : "text-muted hover:text-fg border border-transparent"
              )}
            >
              USD ($)
            </button>
            <button
              type="button"
              onClick={() => setRegion("india")}
              className={cn(
                "px-4 py-1.5 rounded-md text-[13px] font-[650] transition-all duration-300",
                region === "india" ? "bg-surface text-fg shadow-sm border border-border" : "text-muted hover:text-fg border border-transparent"
              )}
            >
              INR (₹)
            </button>
          </div>
        </div>

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
                    ? "border-accent shadow-[0_0_30px_-10px_rgba(var(--accent-rgb),0.3)] scale-[1.02] lg:scale-[1.05] z-10" 
                    : "border-border hover:border-border-strong hover:-translate-y-1"
                )}
              >
                {isBusiness && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-[800] uppercase tracking-widest px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                
                <div className="p-6 border-b border-border flex flex-col gap-1">
                  <h4 className="text-[18px] font-[800] text-fg">{info.label}</h4>
                  <p className="text-[13px] text-muted h-10">{info.blurb}</p>
                  
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-[32px] font-[800] tracking-tight text-fg">
                      {region === "india" ? info.priceInr : info.priceUsd}
                    </span>
                    {plan !== "enterprise" && <span className="text-[13px] font-[500] text-muted">/mo</span>}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-6">
                  <ul className="flex flex-col gap-3 flex-1">
                    {info.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-[13px] text-fg/80 leading-relaxed">
                        <CheckIcon />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button disabled className="w-full py-2.5 rounded-lg border border-accent bg-accent/10 text-accent text-[13px] font-[750] transition-colors cursor-default">
                      Current Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={pendingPlan === plan}
                      onClick={() => upgrade(plan)}
                      className={cn(
                        "w-full py-2.5 rounded-lg text-[13px] font-[750] transition-all duration-300",
                        isBusiness
                          ? "bg-accent text-white hover:bg-accent-hover shadow-md hover:shadow-lg"
                          : "bg-surface-hover text-fg border border-border hover:border-fg/30 hover:bg-fg hover:text-bg",
                        pendingPlan === plan && "opacity-50 cursor-wait"
                      )}
                    >
                      {pendingPlan === plan ? "Processing..." : "Upgrade"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Fallbacks & Errors */}
        {fallbackPlan && (
          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 items-start">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/><path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>
            <div className="text-[13px] text-blue-500/90 leading-relaxed">
              The <strong>{PLAN_INFO[fallbackPlan].label}</strong> checkout isn't live yet.{" "}
              <a
                href={`mailto:support@zeva.app?subject=Upgrade%20to%20${encodeURIComponent(PLAN_INFO[fallbackPlan].label)}`}
                className="font-[700] hover:underline"
              >
                Contact us
              </a>{" "}
              and we'll set it up for your account.
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-[13px] text-red-500 font-[500]">
            {error}
          </div>
        )}

        {/* Legal Footer */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-muted text-center md:text-left leading-relaxed">
            By activating a subscription plan, you agree to our{" "}
            <a href="/terms" target="_blank" className="text-accent hover:underline font-[500]">Terms of Service</a>,{" "}
            <a href="/privacy" target="_blank" className="text-accent hover:underline font-[500]">Privacy Policy</a>, and{" "}
            <a href="/refund-policy" target="_blank" className="text-accent hover:underline font-[500]">Refund Policy</a>.
          </p>
          <div className="flex gap-2 opacity-50 grayscale mix-blend-luminosity">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-5" />
          </div>
        </div>
      </div>
      
    </div>
  );
}
