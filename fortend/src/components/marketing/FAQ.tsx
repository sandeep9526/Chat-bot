"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";

const FAQS = [
  {
    q: "How does Ochreshift work?",
    a: "Ochreshift uses advanced RAG (Retrieval-Augmented Generation) technology. We ingest the documents, links, and text you provide in your dashboard. When a user asks a question, Ochreshift searches your content and generates an answer strictly based on that data.",
  },
  {
    q: "Can I train the AI on my own content?",
    a: "Yes! You can upload documents, paste text, or connect your website URLs. Ochreshift will index everything and use it as the knowledge base for all conversations.",
  },
  {
    q: "What sources can I connect?",
    a: "You can connect websites, PDFs, Word documents, text files, FAQs, and more. Ochreshift supports a wide range of formats to build your knowledge base.",
  },
  {
    q: "Does it support lead capture?",
    a: "Absolutely. Ochreshift can collect visitor information like name, email, and phone number during conversations, turning every chat into a potential lead.",
  },
  {
    q: "Can I embed it on my website?",
    a: "Yes! Simply paste one line of code into your website's HTML. It works with WordPress, Shopify, custom sites, and any other platform.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, there are no long-term contracts. You can downgrade or cancel your plan at any time from your dashboard settings.",
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="bg-[#F8F8F6] section-normal">
      <div className="marketing-container max-w-[780px]">
        
        <Reveal>
          <div className="text-center mb-12">
            <p className="eyebrow mx-auto">FAQ</p>
            <h2 className="mt-4 marketing-h2">
              Frequently Asked Questions
            </h2>
          </div>
        </Reveal>

        <div>
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <Reveal key={idx} delay={idx * 40}>
                <div className="border-b border-[#E5E7EB]">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="group flex w-full items-center justify-between py-[22px] text-left transition-colors duration-200 hover:bg-white -mx-4 px-4 rounded-[10px]"
                  >
                    <span className={`text-[16px] font-[600] pr-4 transition-colors duration-200 ${isOpen ? "text-[#F5A900]" : "text-bg group-hover:text-bg"}`}>{faq.q}</span>
                    <span className={`ml-4 shrink-0 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${isOpen ? "rotate-45 border-[#F5A900] bg-[#F5A900]/10 text-[#F5A900]" : "border-[#E5E7EB] bg-white text-[#475569] group-hover:border-[#F5A900]/40 group-hover:text-[#F5A900]"}`}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
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
                      <p className="pb-6 pr-12 text-[16px] leading-[1.65] text-[#475569]">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}
