import type { Metadata } from "next";
import Script from "next/script";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Hero } from "@/components/marketing/Hero";
import { ProofBar } from "@/components/marketing/ProofBar";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { FeatureTabs } from "@/components/marketing/FeatureTabs";
import { UseCases } from "@/components/marketing/UseCases";
import { TrustSection } from "@/components/marketing/TrustSection";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Pricing } from "@/components/marketing/Pricing";
import { FAQ } from "@/components/marketing/FAQ";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";
import { SmoothScroll } from "@/components/marketing/SmoothScroll";
import { MarketingThemeInit } from "@/components/marketing/MarketingThemeInit";

export const metadata: Metadata = {
  title: "OchreShift · AI Lead Capture for Service Businesses",
  description:
    "OchreShift is an AI lead capture platform that answers customer questions instantly using your business knowledge, qualifies leads, and alerts your team when a human is needed.",
  keywords: ["AI lead capture", "service businesses", "chatbot", "customer support automation", "lead generation"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "OchreShift · AI Lead Capture for Service Businesses",
    description:
      "Answers only from your content, with sources — and captures every lead while you sleep. One script tag, any site, fully managed.",
    type: "website",
  },
};

const WIDGET_BOT_ID = process.env.NEXT_PUBLIC_SITE_WIDGET_BOT_ID;
const WIDGET_API_URL = process.env.NEXT_PUBLIC_SITE_WIDGET_API_URL;

export default function Home() {
  return (
    <>
      <MarketingThemeInit />
      <SmoothScroll>
        <SiteHeader />
        <main>
          <Hero />
          <ProofBar />
          <ProblemSection />
          <FeatureTabs />
          <UseCases />
          <TrustSection />
          <Testimonials />
          <Pricing />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </SmoothScroll>

      {/* Dogfooding: when configured, our own AI agent runs on this very page —
          proof, demo, and lead capture in one. */}
      {WIDGET_BOT_ID && (
        <Script
          src="/widget.js"
          strategy="lazyOnload"
          data-bot-id={WIDGET_BOT_ID}
          {...(WIDGET_API_URL ? { "data-api-url": WIDGET_API_URL } : {})}
          data-name="OchreShift AI"
          data-accent="#F5A900"
          data-surface="auto"
          data-corners="soft"
          data-launcher="pill"
          data-position="bottom-right"
          data-glass="on"
          data-sources="on"
        />
      )}
    </>
  );
}
