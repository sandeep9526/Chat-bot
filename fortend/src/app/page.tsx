import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Hero } from "@/components/marketing/Hero";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { ProductMechanism } from "@/components/marketing/ProductMechanism";
import { GroundedAnswers } from "@/components/marketing/GroundedAnswers";
import { KnowledgeBase } from "@/components/marketing/KnowledgeBase";
import { LeadQualification } from "@/components/marketing/LeadQualification";
import { HumanTakeover } from "@/components/marketing/HumanTakeover";
import { UseCases } from "@/components/marketing/UseCases";
import { TrustSection } from "@/components/marketing/TrustSection";
import { InstallationSpeed } from "@/components/marketing/InstallationSpeed";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";
import { SmoothScroll } from "@/components/marketing/SmoothScroll";
import { MarketingThemeInit } from "@/components/marketing/MarketingThemeInit";

export const metadata: Metadata = {
  title: "OchreShift · AI Lead Capture for Service Businesses",
  description:
    "OchreShift is an AI lead capture platform that answers customer questions instantly using your business knowledge, qualifies leads, and alerts your team when a human is needed.",
  openGraph: {
    title: "OchreShift · AI Lead Capture for Service Businesses",
    description:
      "Answers only from your content, with sources — and captures every lead while you sleep. One script tag, any site, fully managed.",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <MarketingThemeInit />
      <SmoothScroll>
        <SiteHeader />
        <main>
          <Hero />
          <ProblemSection />
          <ProductMechanism />
          <GroundedAnswers />
          <KnowledgeBase />
          <LeadQualification />
          <HumanTakeover />
          <UseCases />
          <TrustSection />
          <InstallationSpeed />
          <FinalCTA />
        </main>
        <Footer />
      </SmoothScroll>
    </>
  );
}
