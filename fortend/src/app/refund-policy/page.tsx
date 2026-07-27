"use client";

import React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Footer } from "@/components/marketing/Footer";
import { Container } from "@/components/marketing/Container";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="py-16 sm:py-24">
        <Container>
          <div className="max-w-4xl mx-auto space-y-12">
            <div>
              <span className="text-[12px] font-[750] uppercase tracking-wider text-accent">Billing & Subscription Legal</span>
              <h1 className="mt-2 text-3xl sm:text-5xl font-[800] tracking-tight text-fg font-display">
                Refund & Subscription Cancellation Policy
              </h1>
              <p className="mt-3 text-[14px] sm:text-[15px] text-muted">
                Effective Date: July 1, 2026 • Compliant with Stripe & Razorpay Live Merchant Guidelines & RBI e-Mandate Frameworks
              </p>
            </div>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">1. Subscription Plans & Billing Cycle Rules</h2>
              <p>
                Zeva AI operates on a pay-as-you-grow tiered recurring software-as-a-service (SaaS) subscription model, offering Free, Pro ($29/month or ₹2,499/month), and Enterprise ($149/month or ₹11,999/month) packages. Subscriptions are billed in advance on a monthly or annual recurring cycle via our licensed merchant payment processors: <strong className="text-fg">Stripe Inc.</strong> (for global USD billing) and <strong className="text-fg">Razorpay Software Pvt. Ltd.</strong> (for domestic INR / UPI credit mandates in India).
              </p>
            </section>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">2. Self-Serve Subscription Cancellation</h2>
              <p>
                Subscribers retain unrestricted freedom to terminate or downgrade their recurring subscription tiers at any time directly within the Zeva Studio application dashboard:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Navigate to your admin dashboard at <Link href="/studio" className="text-accent font-[600] hover:underline">zeva.app/studio</Link>.</li>
                <li>Select your Bot or tenant workspace and access the <strong className="text-fg">Billing &amp; Plan Upgrade</strong> section.</li>
                <li>Click <strong className="text-fg">Manage Stripe/Razorpay Subscription</strong> to open your automated customer self-serve billing portal and execute subscription cancellation.</li>
              </ol>
              <p>
                Upon cancellation, your active Pro or Enterprise features remain fully operational until the conclusion of your current already-paid monthly billing period. No further recurring charges will be scheduled.
              </p>
            </section>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">3. Refund Eligibility & Dispute Windows</h2>
              <p>
                Due to direct third-party generative artificial intelligence GPU compute costs and LLM token processing expenses incurred immediately upon chatbot usage, Zeva enforces structured refund eligibility criteria:
              </p>
              <div className="space-y-3 mt-3">
                <div className="rounded-r1 border border-border bg-panel p-4">
                  <h3 className="font-[700] text-fg">✅ 7-Day Initial Upgrade Money-Back Guarantee</h3>
                  <p className="mt-1 text-[13.5px] text-muted">
                    If you upgrade to a paid Pro or Enterprise tier for the first time and discover that Zeva does not meet your business requirements, you may request a 100% full refund within <strong className="text-fg">7 calendar days of initial checkout</strong>, provided total AI message generation volume during the period remains below 200 interaction turns.
                  </p>
                </div>
                <div className="rounded-r1 border border-border bg-panel p-4">
                  <h3 className="font-[700] text-fg">⚠️ Subsequent & Annual Recurring Billing Renewals</h3>
                  <p className="mt-1 text-[13.5px] text-muted">
                    Recurring automatic monthly renewal charges are non-refundable after the 7-day window. For annual prepayments, termination requests submitted within the initial 14 calendar days are eligible for a pro-rated reimbursement calculated based on regular monthly non-discounted pricing rates.
                  </p>
                </div>
              </div>
              <p>
                To initiate a formal refund review or account credit adjustment, email our merchant support desk at <a href="mailto:billing@zeva.app" className="text-accent font-[600] hover:underline">billing@zeva.app</a> attaching your Stripe invoice invoice-id or Razorpay payment reference number (<code className="text-mono">pay_xxxxxxxxx</code>). Approved refunds are processed back to the original funding bank account or credit card within 5 to 7 business days.
              </p>
            </section>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">4. Reserve Bank of India (RBI) e-Mandate Compliance (India)</h2>
              <p>
                In compliance with Reserve Bank of India circulars (RBI/2019-20/67 and subsequent directives governing recurring online card payment e-mandates), our domestic Indian billing engine administered by Razorpay guarantees strict consumer authorization safeguards:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-fg">Mandated Pre-Debit Notification:</strong> For all recurring INR subscription debit attempts exceeding ₹5,000 or initial automated scheduled renewals, an SMS and email notification will be automatically dispatched to your registered contact coordinates <strong className="text-fg">at least 24 hours prior to the scheduled deduction</strong>.</li>
                <li><strong className="text-fg">Direct Modification &amp; Revocation:</strong> Every pre-debit alert email contains a dedicated secure link empowering Indian cardholders to instantly modify, pause, or revoke recurring e-Mandates without contacting customer support.</li>
              </ul>
            </section>

            <section className="space-y-4 text-[14.5px] leading-relaxed text-muted border-t border-border pt-8">
              <h2 className="text-xl font-[750] text-fg">5. Chargebacks & Payment Defaults</h2>
              <p>
                Submitting fraudulent chargeback disputes through banking institutions without prior communication with our billing support desk constitutes a breach of our Terms of Service. In the event of an unjustified dispute or credit default, active API bot generation tokens are automatically restricted, and custom domains are temporarily reverted to standard Free sandbox limits until payment resolution is confirmed.
              </p>
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
