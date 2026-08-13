"use client";

import React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Footer } from "@/components/marketing/Footer";
import { Container } from "@/components/marketing/Container";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="py-16 sm:py-24">
        <Container>
          <div className="max-w-4xl mx-auto space-y-12">
            <div>
              <span className="text-[12px] font-[750] uppercase tracking-wider text-accent">Telemetry & AI Transparency</span>
              <h1 className="mt-2 text-3xl sm:text-5xl font-[800] tracking-tight text-fg font-display">
                Cookie, Telemetry &amp; AI Disclosure Policy
              </h1>
              <p className="mt-3 text-[14px] sm:text-[15px] text-muted">
                Effective Date: July 1, 2026 • Compliant with ePrivacy Directive, GDPR &amp; EU AI Act Article 50
              </p>
            </div>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">1. Introduction to Cookie Technologies & Telemetry</h2>
              <p>
                When you access the ochreshift administrative Studio, marketing portal, or communicate through our embeddable web chat widget (<code className="text-accent font-mono text-[13px]">widget.js</code>), our software architecture automatically employs browser cookies, session local storage keys, and strict performance telemetry scripts to authenticate sessions, secure API routing, and prevent malicious spam abuse.
              </p>
            </section>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">2. Categorization of Deployable Cookies & Storage Keys</h2>
              <p>
                We classify our application storage primitives into three essential categories:
              </p>
              <div className="space-y-4 mt-4">
                <div className="rounded-r1 border border-border bg-panel p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-[750] text-fg">🔐 Strictly Necessary & Authentication Cookies</h3>
                    <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-[700] text-accent">Mandatory</span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] text-muted">
                    Managed via our Better Auth identity verification layer and JSON Web Tokens (JWTs). These local storage primitives remember active login state, enforce multi-tenant dashboard authorization, and maintain safe Cross-Site Request Forgery (CSRF) security boundaries. ochreshift administrative consoles cannot function without these strictly necessary authentication tokens.
                  </p>
                </div>

                <div className="rounded-r1 border border-border bg-panel p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-[750] text-fg">💳 Payment Fraud Prevention & KYC Scripts</h3>
                    <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-[700] text-accent">Mandatory</span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] text-muted">
                    During subscription checkouts and merchant onboarding, licensed third-party processors (<strong className="text-fg">Stripe Inc.</strong> and <strong className="text-fg">Razorpay Software Pvt. Ltd.</strong>) deploy secure device fingerprinting scripts to intercept automated credit card testing botnets, comply with PSD2 Strong Customer Authentication (SCA) laws, and fulfill international anti-money laundering (AML) regulatory KYC mandates.
                  </p>
                </div>

                <div className="rounded-r1 border border-border bg-panel p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-[750] text-fg">📈 Anonymous Performance Telemetry & RAG Diagnostics</h3>
                    <span className="rounded-full bg-border px-2.5 py-0.5 text-[11px] font-[700] text-muted">Optional</span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] text-muted">
                    We harvest anonymous UI interaction timings, RAG document retrieval latency metrics, and model failover frequencies to optimize database indexing speed and eliminate chatbot hallucination errors. No personally identifiable consumer contact data or raw chat messages are syndicated to behavioral marketing tracking networks.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">3. EU AI Act Article 50 & FTC AI Transparency Notice</h2>
              <p>
                In strict compliance with Article 50 of the European Union Artificial Intelligence Act and Federal Trade Commission (FTC) deceptive advertising protocols, we mandate absolute conversational transparency:
              </p>
              <div className="rounded-r1 border border-accent/40 bg-accent/10 p-4 text-fg text-[14px]">
                🤖 <strong>AI Entity Attribution:</strong> Visitors communicating with automated ochreshift widgets are explicitly notified via permanent visual attribution badges (e.g., <em>&quot;Powered by ochreshift&quot;</em> or <em>&quot;Automated AI Assistant&quot;</em>) that they are corresponding with an artificial algorithmic intelligence engine rather than a live human support representative.
              </div>
              <p>
                When an end-user expresses dissatisfaction or queries an edge-case outside the custom knowledge base, our automated routing engine immediately presents an unambiguous option to initiate human helpdesk escalation or schedule follow-up contact with a live commercial agent.
              </p>
            </section>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">4. Browser Configuration & Opt-Out Controls</h2>
              <p>
                You retain complete sovereign control over non-essential browser tracking preferences. Most modern desktop and mobile browsers empower users to block, isolate, or purge stored local storage cookies via privacy configuration panels:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-fg">Google Chrome / Chromium:</strong> Settings → Privacy &amp; Security → Third-Party Cookies.</li>
                <li><strong className="text-fg">Apple Safari &amp; iOS:</strong> Preferences → Privacy → Block All Cookies or Prevent Cross-Site Tracking.</li>
                <li><strong className="text-fg">Mozilla Firefox:</strong> Settings → Privacy &amp; Security → Enhanced Tracking Protection (Strict Mode).</li>
              </ul>
              <p>
                Please be aware that disabling all cookies will prevent seamless dashboard logins at <code className="text-mono">ochreshift.com/sign-in</code> and may disrupt active customer checkout sessions. For further data deletion inquiries, consult our complete <Link href="/privacy" className="text-accent font-[600] hover:underline">Privacy Policy</Link>.
              </p>
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
