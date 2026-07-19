import type { Metadata } from "next";
import { FAQ } from "@/components/marketing/FAQ";
import { Features } from "@/components/marketing/Features";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { MarketingThemeInit } from "@/components/marketing/MarketingThemeInit";
import { Marquee } from "@/components/marketing/Marquee";
import { Nav } from "@/components/marketing/Nav";
import { Pricing } from "@/components/marketing/Pricing";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { ScrollProgress } from "@/components/marketing/ScrollProgress";
import { SecurityBand } from "@/components/marketing/SecurityBand";
import { TrustSection } from "@/components/marketing/TrustSection";
import { WhyZevaQuotes } from "@/components/marketing/WhyZevaQuotes";

export const metadata: Metadata = {
  title: "Zeva · A chatbot that only answers from your content",
  description:
    "Zeva is a RAG-powered AI chat widget for small businesses. It reads your website, FAQs and docs, answers your customers 24/7 with cited sources — never made-up — and captures every lead. One script tag, any site, fully managed.",
  openGraph: {
    title: "Zeva · A chatbot that only answers from your content",
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
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <ProblemSection />
        <HowItWorks />
        <Features />
        <WhyZevaQuotes />
        <SecurityBand />
        <TrustSection />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
