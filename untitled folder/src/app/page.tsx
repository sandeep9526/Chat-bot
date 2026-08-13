import type { Metadata } from "next";
import { FAQ } from "@/components/marketing/FAQ";
import { Features } from "@/components/marketing/Features";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { MarketingThemeInit } from "@/components/marketing/MarketingThemeInit";

import { SiteHeader } from "@/components/marketing/SiteHeader";
import { ProductOverview } from "@/components/marketing/ProductOverview";
import { DeveloperFeatures } from "@/components/marketing/DeveloperFeatures";
import { AIChatPreview } from "@/components/marketing/AIChatPreview";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { Pricing } from "@/components/marketing/Pricing";

import { TrustSection } from "@/components/marketing/TrustSection";


import { ZevaWidget } from "@/components/widget/ZevaWidget";

export const metadata: Metadata = {
  title: "ochreshift · A chatbot that only answers from your content",
  description:
    "ochreshift is a RAG-powered AI chat widget for small businesses. It reads your website, FAQs and docs, answers your customers 24/7 with cited sources — never made-up — and captures every lead. One script tag, any site, fully managed.",
  openGraph: {
    title: "ochreshift · A chatbot that only answers from your content",
    description:
      "Answers only from your content, with sources — and captures every lead while you sleep. One script tag, any site, fully managed.",
    type: "website",
  },
};

// Dark-first, cinematic marketing home. MarketingBoot sets the theme + arms the
// scroll-reveal system before first paint; the rest is progressive enhancement.
export default function Home() {
  return (
    <>
      <MarketingThemeInit />
      <SiteHeader />
      <main>
        <Hero />
        <ProductOverview />
        <DeveloperFeatures />

        <Features />
        <AIChatPreview />
        <DashboardPreview />

        <TrustSection />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <ZevaWidget />
      <Footer />
    </>
  );
}
