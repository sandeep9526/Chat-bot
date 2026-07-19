"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

const QA = [
  {
    q: "Does it make up answers?",
    a: "No. Zeva only answers from your content and cites the source for each reply. If the answer isn't in your documents, it says so instead of inventing one.",
  },
  {
    q: "What can I feed it?",
    a: "Your website, FAQs, price lists, PDFs and docs — whatever your customers actually ask about.",
  },
  {
    q: "Where does it work?",
    a: "Any website: plain HTML, WordPress, Shopify or PrestaShop — installed with a single script tag.",
  },
  {
    q: "Do I need a developer?",
    a: "No. We build, host and maintain everything. You send us your content; we handle the rest.",
  },
  {
    q: "How fast is setup?",
    a: "A working bot trained on your own site in minutes; a full branded rollout in a day or two.",
  },
  {
    q: "Is my data safe?",
    a: "Your content is used only to power your own bot — it's never mixed with anyone else's knowledge base.",
  },
  {
    q: "Can I change the design?",
    a: "Yes — live, in the Studio. Colour, corners, font, launcher and glass, all previewed in real time.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-[820px] px-6 sm:px-9">
        <SectionHead
          align="center"
          eyebrow="Questions"
          title="Everything you might be wondering."
        />

        <div className="mt-10 flex flex-col gap-3">
          {QA.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 40}>
                <div
                  className={`card overflow-hidden transition-colors ${
                    isOpen ? "border-accent-ring" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[15.5px] font-[700] text-fg">
                      {item.q}
                    </span>
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? "rotate-45 border-accent-ring bg-accent-soft text-accent"
                          : "border-border text-muted"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="h-4 w-4"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-[14px] leading-[1.65] text-muted">
                        {item.a}
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
