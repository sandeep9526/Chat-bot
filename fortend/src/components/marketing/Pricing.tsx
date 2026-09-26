"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

interface Tier {
  name: string;
  blurb: string;
  priceUsd: string;
  priceInr: string;
  period?: string;
  cta: { label: string; href: string };
  features: string[];
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    blurb: "Essential tools for small teams & salons.",
    priceUsd: "$19",
    priceInr: "₹1,499",
    period: "/mo",
    cta: { label: "Start free", href: "/sign-up" },
    features: [
      "2,000 Messages/mo",
      "1 AI Chatbot",
      "Basic Analytics",
      "Standard Support",
    ],
  },
  {
    name: "Pro",
    blurb: "High volume, lead scoring & white-labeling.",
    priceUsd: "$49",
    priceInr: "₹3,999",
    period: "/mo",
    cta: { label: "Start 14-day free trial", href: "/sign-up" },
    featured: true,
    features: [
      "10,000 Messages/mo",
      "5 AI Chatbots",
      "Remove 'Powered by' Branding",
      "WhatsApp & Lead Forms",
      "Priority Support",
    ],
  },
  {
    name: "Business",
    blurb: "For multi-location & growing teams.",
    priceUsd: "$99",
    priceInr: "₹7,999",
    period: "/mo",
    cta: { label: "Start 14-day free trial", href: "/sign-up" },
    features: [
      "50,000 Messages/mo",
      "25 AI Chatbots",
      "Advanced Analytics & CRM export",
      "Full Custom Branding",
      "Dedicated Account Manager",
    ],
  },
  {
    name: "Enterprise",
    blurb: "Custom scale, SLA, and integrations.",
    priceUsd: "Custom",
    priceInr: "Custom",
    cta: { label: "Contact sales", href: "mailto:support@ochreshift.com" },
    features: [
      "Custom volume",
      "24/7 phone support",
      "Dedicated manager",
      "SLA guarantee",
      "Custom contracts",
    ],
  },
];

const RISK_REVERSAL = ["14-day free trial", "No credit card required", "Cancel anytime"];

export function Pricing() {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");

  useEffect(() => {
    try {
      if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Kolkata") {
        setCurrency("INR");
      }
    } catch (e) { }
  }, []);

  return (
    <section id="pricing" className="py-24 bg-bg border-t border-border scroll-mt-20 font-sans">
      <Container>
        <SectionHead
          align="center"
          eyebrow="Pricing"
          title="Simple, predictable pricing."
          description="Start free, upgrade when you're capturing leads. Every plan includes grounded answers with visible sources."
          className="mb-10"
        />

        <div className="flex justify-center mb-12">
          <div className="relative flex items-center p-1 rounded-full bg-surface-hover border border-border shadow-inner">
            <div
              className="absolute top-1 bottom-1 w-24 rounded-full bg-bg shadow-[0_1px_3px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out"
              style={{
                transform: currency === "USD" ? "translateX(100%)" : "translateX(0)",
              }}
            />
            <button
              onClick={() => setCurrency("INR")}
              className={`relative w-24 h-9 flex items-center justify-center rounded-full text-[14px] font-[600] transition-colors z-10 ${currency === "INR" ? "text-fg" : "text-muted hover:text-fg"
                }`}
            >
              India (₹)
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`relative w-24 h-9 flex items-center justify-center rounded-full text-[14px] font-[600] transition-colors z-10 ${currency === "USD" ? "text-fg" : "text-muted hover:text-fg"
                }`}
            >
              Global ($)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-[1200px] mx-auto">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 90} className="h-full">
              <div
                className={`relative flex flex-col h-full rounded-2xl p-8 transition-all duration-300 ${tier.featured
                    ? "border-2 border-accent bg-surface shadow-[0_18px_50px_-16px_rgba(245,169,0,0.28)] md:-translate-y-2"
                    : "border border-border bg-surface shadow-card hover:border-accent/40 hover:-translate-y-1"
                  }`}
              >
                {tier.featured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-[11px] font-[700] uppercase tracking-wider text-[#08111F] whitespace-nowrap">
                    Most popular
                  </span>
                )}

                <h3 className={`text-[20px] font-[700] text-fg ${tier.featured ? "text-[21px]" : ""}`}>
                  {tier.name}
                </h3>
                <p className="mt-2 text-[15px] text-muted">{tier.blurb}</p>

                <div className="mt-6 flex items-baseline">
                  <span
                    className={`font-[750] tracking-[-0.03em] leading-none text-fg transition-opacity duration-300 ${tier.priceUsd === "Custom" ? "text-[36px]" : "text-[44px]"
                      }`}
                  >
                    {currency === "INR" ? tier.priceInr : tier.priceUsd}
                  </span>
                  {tier.period && tier.priceUsd !== "Custom" && (
                    <span className="ml-2 text-[15px] text-muted">{tier.period}</span>
                  )}
                </div>

                <Link
                  href={tier.cta.href}
                  className={`mt-7 flex h-11 items-center justify-center rounded-[10px] w-full text-[15px] font-[600] transition-all duration-150 ${tier.featured
                      ? "bg-accent text-[#08111F] hover:bg-accent-strong active:scale-[0.98]"
                      : "border border-border bg-panel text-fg hover:border-accent/50 hover:-translate-y-[1px]"
                    }`}
                >
                  {tier.cta.label}
                </Link>

                <ul className="mt-7 space-y-3.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-[15px] text-muted">
                      <Check strokeWidth={2.5} className="h-4 w-4 text-accent shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="mt-12 text-center text-[14px] text-muted font-[500] flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {RISK_REVERSAL.map((item, i) => (
              <span key={item} className="flex items-center gap-3">
                {i > 0 && <span className="w-1.5 h-1.5 rounded-full bg-border" aria-hidden />}
                {item}
              </span>
            ))}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
