"use client";

import React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Footer } from "@/components/marketing/Footer";
import { Container } from "@/components/marketing/Container";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="py-16 sm:py-24">
        <Container>
          <div className="max-w-4xl mx-auto space-y-12">
            <div>
              <span className="text-[12px] font-[750] uppercase tracking-wider text-accent">Privacy & Sovereignty</span>
              <h1 className="mt-2 text-3xl sm:text-5xl font-[800] tracking-tight text-fg font-display">
                Privacy Policy & Data Governance
              </h1>
              <p className="mt-3 text-[14px] sm:text-[15px] text-muted">
                Effective Date: July 1, 2026 • Compliant with GDPR, CCPA/CPRA, and DPDPA 2023
              </p>
            </div>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">1. Personal Data Collection Classes</h2>
              <p>
                To power advanced conversational support bots and seamless merchant integrations, Zeva AI architecture systematically categorizes and governs five principal customer data classes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-fg">Authentication & Account Identity:</strong> Better Auth JSON Web Tokens (JWTs), email addresses, cryptographic password salts, and role authorization markers.</li>
                <li><strong className="text-fg">Billing & Corporate KYC Metadata:</strong> Stripe customer tokens, Razorpay plan subscriptions, company PAN/GSTIN identifiers, and invoice transaction ledgers (credit card full primary account numbers are never processed directly by our backend servers).</li>
                <li><strong className="text-fg">Uploaded Corporate Knowledge Bases:</strong> Text corpora, markdown files, custom system behavioral directives, and website ingestion vectors submitted via <code className="text-accent font-mono text-[13px]">/ingest-file</code> or URL sitemaps.</li>
                <li><strong className="text-fg">Visitor Conversation Transcripts:</strong> Real-time message exchanges stored within PostgreSQL <code className="text-accent font-mono text-[13px]">chats</code> tables, including AI model selection history and RAG confidence scores.</li>
                <li><strong className="text-fg">Lead Acquisition Records:</strong> Visitor names, mobile phone numbers, verified emails, and interactive intent scores captured within the chat widget and synced across CRM Webhooks or Google Sheets pipelines.</li>
              </ul>
            </section>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">2. Jurisdictional Statutory Compliance & Consumer Rights</h2>
              <p>
                Our data architectures strictly operationalize global privacy legal frameworks across multi-region tenant boundaries:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="rounded-r1 border border-border bg-panel p-4">
                  <h3 className="font-[750] text-fg text-[15px]">🇪🇺 European Union (GDPR)</h3>
                  <p className="mt-1.5 text-[13px] text-muted">
                    Full adherence to GDPR Articles 13, 14, and 17. European residents retain unrestricted rights to data access, rectifying AI inferences, and exercising total erasure ("Right to be Forgotten").
                  </p>
                </div>
                <div className="rounded-r1 border border-border bg-panel p-4">
                  <h3 className="font-[750] text-fg text-[15px]">🇺🇸 California (CCPA / CPRA)</h3>
                  <p className="mt-1.5 text-[13px] text-muted">
                    We do not sell or commercialize consumer personal information or visitor conversational transcripts to data marketing syndicates under California Consumer Privacy Act regulations.
                  </p>
                </div>
                <div className="rounded-r1 border border-border bg-panel p-4">
                  <h3 className="font-[750] text-fg text-[15px]">🇮🇳 India (DPDPA 2023)</h3>
                  <p className="mt-1.5 text-[13px] text-muted">
                    Aligned with the Digital Personal Data Protection Act of India. We enforce explicit operational purpose limitation, secure domestic encryption controls, and accessible customer grievance resolution.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">3. Subject Erasure & Data Portability Execution</h2>
              <p>
                Zeva empowers tenant administrators and privacy officers with self-serve algorithmic governance controls directly integrated within our Studio panel:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-fg">Instant GDPR Subject Erasure (Right to be Forgotten):</strong> Using our secure endpoint <code className="text-accent font-mono text-[13px]">POST /api/privacy/erasure-request</code>, bot owners can submit a target individual&apos;s email address, phone number, or formal identifier to permanently purge all associated lead entries and conversation logs across PostgreSQL and backup databases within seconds.</li>
                <li><strong className="text-fg">1-Click JSON Data Portability Archive:</strong> Inside Account &amp; Security configuration screens, subscribers can click <strong className="text-fg">"📦 Export Account &amp; Customer Data"</strong> to instantly download a verifiable JSON bundle containing their complete account configuration, active bot prompts, customer interaction transcripts, and captured leads.</li>
              </ul>
            </section>

            <section id="subprocessors" className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">4. Subprocessor Transparency Registry</h2>
              <p>
                In compliance with global disclosure rules, we publish and continuously maintain our inventory of verified cloud subprocessors handling platform telemetry or commercial AI payloads:
              </p>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-[13.5px]">
                  <thead>
                    <tr className="border-b border-border text-fg font-[700] bg-panel/50">
                      <th className="py-2.5 px-3">Entity / Partner</th>
                      <th className="py-2.5 px-3">Processing Role &amp; Scope</th>
                      <th className="py-2.5 px-3">Data Sovereignty &amp; Residency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-3 px-3 font-[650] text-fg">Neon Inc. / AWS</td>
                      <td className="py-3 px-3">Managed PostgreSQL Database Server Hosting</td>
                      <td className="py-3 px-3">USA &amp; European Regions (Encrypted At Rest)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-[650] text-fg">OpenRouter / OpenAI</td>
                      <td className="py-3 px-3">Generative Chat Inference &amp; LLM Failover Chains</td>
                      <td className="py-3 px-3">USA (Zero-Retention; No Model Training)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-[650] text-fg">Stripe Inc. &amp; Razorpay Software Pvt. Ltd.</td>
                      <td className="py-3 px-3">Global (USD) &amp; Domestic India (INR/UPI) Checkout</td>
                      <td className="py-3 px-3">USA &amp; India (PCI-DSS Level 1 Certified)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-[650] text-fg">Vercel / Cloudflare</td>
                      <td className="py-3 px-3">Application Edge Runtime, DNS Security &amp; Asset Delivery</td>
                      <td className="py-3 px-3">Global Content Delivery Edge Network</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="security" className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">5. Security Architecture & Attestations Roadmap (SOC 2 Type II)</h2>
              <p>
                Zeva engineering operations adhere to defense-in-depth cybersecurity protocols designed to satisfy institutional auditing requirements (SOC 2 Type II and ISO 27001 readiness):
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-fg">Multi-Tenant Row-Level Security (RLS):</strong> Our database tier employs strict relational filtering and owner tenancy binding. Tenant data is isolated down to the database session level, ensuring no bot owner can inspect or query another tenant&apos;s customer communications.</li>
                <li><strong className="text-fg">Dedicated PII Scrubbing &amp; Redaction Interceptors:</strong> Prior to writing application logs or transmitting prompts across cloud inference APIs, our centralized sanitization module (<code className="text-accent font-mono">logger.py</code>) applies automated regular expression filters to redact credit card sequences (<code className="text-mono">[REDACTED_CARD]</code>), social security numbers (<code className="text-mono">[REDACTED_SSN]</code>), and banking tokens.</li>
                <li><strong className="text-fg">Cryptographic Field Encryption:</strong> Sensitive customer communications and internal notes are protected using symmetrical encryption cipher suites (AES-256 / Fernet) in transit via TLS 1.3 and at rest across high-availability cloud storage volumes.</li>
              </ul>
            </section>

            <section id="dpa" className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">6. Data Processing Addendum (DPA) & Contractual Roles</h2>
              <p>
                For B2B Enterprise subscribers operating in regulated industries, Zeva acts as a dedicated <strong className="text-fg">Data Processor</strong>, while the subscribing merchant or business enterprise retains exclusive ownership as the governing <strong className="text-fg">Data Controller</strong>. Our platform Standard Contractual Clauses (SCCs) are embedded by reference within every commercial subscription agreement.
              </p>
              <p>
                To request a signed copy of our formal institutional Data Processing Addendum (DPA), please contact our legal compliance team at <a href="mailto:legal@zeva.app" className="text-accent font-[600] hover:underline">legal@zeva.app</a>.
              </p>
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
