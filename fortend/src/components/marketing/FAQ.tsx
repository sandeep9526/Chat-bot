"use client";

import { useState } from "react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

const FAQS = [
  {
    q: "How does OchreShift work?",
    a: "OchreShift uses retrieval-augmented generation (RAG). We index the documents, links, and text you provide, and when a visitor asks a question, the AI answers strictly from that content — with a visible citation showing exactly which source the answer came from.",
  },
  {
    q: "Will it make things up or promise services we don't offer?",
    a: "No. Answers are grounded only in your uploaded knowledge — no made-up prices or invented policies. If the answer isn't in your content, OchreShift says so and offers to pass the visitor to your team instead of guessing.",
  },
  {
    q: "Is my business data used to train AI models?",
    a: "Never. Your documents are stored separately for your business alone, and your content is not used to train any public or shared AI models.",
  },
  {
    q: "What happens when a visitor is ready to buy?",
    a: "OchreShift detects buying intent during the conversation, captures their contact details, and scores the lead as Hot, Warm, or Cold. Hot leads trigger an alert so your team can step in while intent is high.",
  },
  {
    q: "Where do my leads go?",
    a: "Straight to your OchreShift dashboard with the full transcript and an AI-written summary — plus instant email notifications, webhooks into your own tools, and an optional WhatsApp channel. You choose where each lead lands.",
  },
  {
    q: "Which website platforms does it work with?",
    a: "Any website you can add a script tag to — WordPress, Shopify, Wix, Webflow, Squarespace, custom HTML, and more. One line of code, no plugins required.",
  },
  {
    q: "How long does setup take?",
    a: "Minutes. Create an agent, upload your PDFs, price sheets, FAQs — or just point OchreShift at your existing web pages — customize the look to match your brand, and paste one script tag on your site.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no long-term contracts — downgrade or cancel from your dashboard whenever you like.",
  },
  {
    q: "What happens after the free trial ends?",
    a: "Pick the plan that fits and keep going — your agent, knowledge, and captured leads stay exactly as they are. If you do nothing, the widget simply pauses; we never charge without your say-so.",
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-bg border-t border-border scroll-mt-20 font-sans">
      <Container>
        <SectionHead
          align="center"
          eyebrow="FAQ"
          title="Questions, answered."
          className="mb-12"
        />

        <div className="max-w-[780px] mx-auto">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <Reveal key={idx} delay={idx * 40}>
                <div className="border-b border-border">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center justify-between py-[22px] text-left transition-colors duration-200 -mx-4 px-4 rounded-[10px] hover:bg-panel"
                  >
                    <span
                      className={`text-[16px] font-[600] pr-4 transition-colors duration-200 ${
                        isOpen ? "text-accent" : "text-fg group-hover:text-accent"
                      }`}
                    >
                      {faq.q}
                    </span>
                    <span
                      className={`ml-4 shrink-0 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? "rotate-45 border-accent bg-accent/10 text-accent"
                          : "border-border bg-panel text-muted group-hover:border-accent/40 group-hover:text-accent"
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                        <path d="M7 3v8M3 7h8" />
                      </svg>
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-6 pr-12 text-[16px] leading-[1.65] text-muted">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
