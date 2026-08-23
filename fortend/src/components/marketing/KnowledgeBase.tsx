"use client";

import { FileText, FileImage, HelpCircle, FileSpreadsheet } from "lucide-react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

const KB_CARDS = [
  {
    title: "PDFs & Docs",
    description: "Upload existing manuals and brochures.",
    icon: FileText,
  },
  {
    title: "Price Sheets",
    description: "Drop in your service menus and spreadsheets.",
    icon: FileSpreadsheet,
  },
  {
    title: "FAQs & TXT",
    description: "Import your frequently asked questions.",
    icon: HelpCircle,
  },
  {
    title: "Scanned Images",
    description: "Snap a photo of your printed menu.",
    icon: FileImage,
  }
];

export function KnowledgeBase() {
  return (
    <section className="bg-bg w-full font-sans py-24 border-t border-border">
      <Container>
        
        <SectionHead
          align="center"
          eyebrow="Data Inputs"
          title="Use the knowledge your business already has."
          description="No need to build complex flowcharts or write new training data. Just upload the files you use every day, and OchreShift learns instantly."
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {KB_CARDS.map((card, idx) => (
            <Reveal key={idx} delay={100 * idx}>
              <div className="bg-surface border border-border rounded-xl p-6 hover:border-border transition-all shadow-sm flex flex-col gap-4 h-full">
                <div className="w-12 h-12 rounded-lg bg-white/[0.03] border border-border flex items-center justify-center">
                  <card.icon size={24} className="text-[#FFB800]" />
                </div>
                <div>
                  <h3 className="text-[19px] font-[700] text-fg mb-2">{card.title}</h3>
                  <p className="text-[15px] leading-relaxed text-muted">{card.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

      </Container>
    </section>
  );
}
