"use client";

import React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Footer } from "@/components/marketing/Footer";
import { Container } from "@/components/marketing/Container";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="py-16 sm:py-24">
        <Container>
          <div className="max-w-4xl mx-auto space-y-12">
            <div>
              <span className="text-[12px] font-[750] uppercase tracking-wider text-accent">Legal & Compliance</span>
              <h1 className="mt-2 text-3xl sm:text-5xl font-[800] tracking-tight text-fg font-display">
                Terms of Service (ToS)
              </h1>
              <p className="mt-3 text-[14px] sm:text-[15px] text-muted">
                Effective Date: July 1, 2026 • Version 2.4 (Enterprise AI Release)
              </p>
            </div>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">1. Agreement to Terms & Platform Overview</h2>
              <p>
                By creating an account, embedding the ochreshift conversational widget, or upgrading to a paid subscription, you enter into a legally binding agreement with ochreshift AI Ltd. ("ochreshift", "we", or "our"). These Terms govern your usage of our multi-model generative artificial intelligence chatbots, real-time Helpdesk takeover dashboards, and customer data synchronization pipelines.
              </p>
            </section>

            <section id="aup" className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">2. Acceptable Use Policy (AUP) & Scraping Rules</h2>
              <p>
                To maintain high-reliability network architectures and prevent abuse, subscribers strictly agree not to deploy ochreshift for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-fg">Unsolicited Automation & Spam:</strong> Deploying bots to generate bulk unverified messaging, intrusive promotional campaigns, or socially engineered social phishing schemes.</li>
                <li><strong className="text-fg">Abusive RAG Indexing:</strong> Uploading malware, copyright-infringing commercial catalogs, or utilizing internal recursive scrapers against third-party web targets without documented administrative permission.</li>
                <li><strong className="text-fg">Malicious Override Exploits:</strong> Attempting adversarial prompt injection attacks designed to extract underlying model weights, system prompts, or private multi-tenant memory stores.</li>
                <li><strong className="text-fg">Illegal & Deceptive Trade:</strong> Promoting illegal gambling, unlicensed controlled therapeutics, synthetic non-consensual media, or abusive impersonation workflows.</li>
              </ul>
            </section>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">3. Enterprise AI Data Sovereignty Guarantee</h2>
              <p>
                We recognize that commercial business knowledge base files contain proprietary corporate secrets and customer intelligence. Under our strict zero-retention Enterprise Data Sovereignty pledges:
              </p>
              <div className="rounded-r1 border border-accent/30 bg-accent/5 p-4 text-fg font-[500] text-[14px]">
                🛡️ <strong>No Foundational Model Training:</strong> Your uploaded PDF catalogs, database configurations, visitor contact leads, and real-time conversation transcripts will <strong>never be utilized to train, retrain, or refine public foundational LLM weights</strong> (including OpenAI GPT, Meta Llama, Google Gemini, or Mistral architectures).
              </div>
            </section>

            <section id="exemption" className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">4. High-Risk Medical, Legal & Financial Exemption</h2>
              <p>
                ochreshift automated conversational engines are engineered for commercial customer support, general service FAQ resolution, and appointment onboarding. Subscribers explicitly acknowledge and agree to strict high-risk operational domain exclusions:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-fg">Medical Diagnosis & Triage:</strong> ochreshift cannot be deployed as an autonomous clinical healthcare counselor, diagnostic device, or emergency medical dispatch engine.</li>
                <li><strong className="text-fg">Legal & Regulatory Representation:</strong> Responses generated by ochreshift agents do not constitute formal legal representation, statutory defense, or attorney-client privileged interaction.</li>
                <li><strong className="text-fg">Automated Credit & Employment Underwriting:</strong> Prohibiting sole reliance on AI inference for loan approvals, real estate deed closings, automated recruiting disqualification, or actuarial insurance pricing.</li>
              </ul>
            </section>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">5. Limitation of Liability & Generative AI Disclaimers</h2>
              <p>
                While ochreshift incorporates grounded Retrieval-Augmented Generation (RAG) algorithms, multi-model failover chains, and adversarial guardrails, large language models natively possess statistical variance that can result in inaccurate outputs ("hallucinations").
              </p>
              <p>
                To the maximum extent permitted by governing corporate law, ochreshift disclaims liability for commercial losses, missed customer appointments, contractual inaccuracies, or revenue variance resulting from automated agent responses. Subscribers assume primary obligation for reviewing chat analytics and configuring fallback live human intervention thresholds.
              </p>
            </section>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">6. Subscription Termination & Default Rules</h2>
              <p>
                Platform administrators reserve the unilateral right to suspend AI inference endpoints or terminate user accounts immediately without financial reimbursement upon verification of deliberate Terms of Service violations, payment dispute chargebacks, or continuous automated abusive bandwidth ingestion.
              </p>
              <p>
                Upon formal voluntary subscription termination or account deletion through the Studio security portal, all customer ledgers, custom embeddings, and lead rosters are permanently scrubbed from active storage within 30 days pursuant to our <Link href="/privacy" className="text-accent hover:underline font-[600]">Privacy & Data Governance Policy</Link>.
              </p>
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
