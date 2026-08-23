import { Reveal } from "./Reveal";
import { Container } from "./Container";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { SectionHead } from "./SectionHead";

export function GroundedAnswers() {
  return (
    <section className="py-24 bg-bg font-sans">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="w-full relative lg:order-2">
            <Reveal delay={200}>
               <div className="bg-surface rounded-2xl p-8 shadow-2xl border border-border flex flex-col gap-6 w-full">
                  {/* AI Answer Extract */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[13px] text-slate-500 uppercase tracking-widest font-[700]">AI Answer Generated</span>
                    <div className="bg-panel border border-border text-fg text-[16px] md:text-[18px] px-5 py-4 md:px-6 md:py-5 rounded-lg shadow-sm">
                      "Yes, our corporate catering packages include a dedicated gluten-free platter upon request at no additional charge."
                    </div>
                  </div>
                  
                  {/* Arrow Down */}
                  <div className="flex justify-center py-1">
                    <div className="w-0.5 h-8 bg-emerald-500/30" />
                  </div>
                  
                  {/* Source Document File */}
                  <div className="flex flex-col gap-3 items-center">
                    <span className="text-[13px] text-slate-500 uppercase tracking-widest font-[700]">Source Document</span>
                    <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 w-fit">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-[14px] font-[600] text-emerald-500">
                        Corporate-Catering-Menu.pdf
                      </span>
                    </div>
                  </div>

                  {/* Arrow Down */}
                  <div className="flex justify-center py-1">
                    <div className="w-0.5 h-8 bg-emerald-500/30" />
                  </div>
                  
                  {/* Matched Text Extract */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[13px] text-slate-500 uppercase tracking-widest font-[700]">Matched Information</span>
                    <div className="bg-white/5 border border-border text-muted text-[15px] md:text-[16px] px-5 py-4 md:px-6 md:py-5 rounded-lg shadow-inner font-mono relative overflow-hidden leading-relaxed">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500/50" />
                      "...All corporate tier 2 and tier 3 packages come with complimentary dietary accommodations. <span className="bg-emerald-500/20 text-emerald-300 rounded px-1.5 py-0.5 font-bold">A dedicated gluten-free platter is included upon request at no additional charge.</span> Please provide 48 hours notice..."
                    </div>
                  </div>
               </div>
            </Reveal>
          </div>
          
          <div className="flex flex-col items-start lg:order-1 xl:pr-8">
            <SectionHead
              eyebrow="Fact-Verified Answers"
              title="See where every answer comes from."
              description="Trust is everything in business. That's why OchreShift doesn't guess. Every answer it provides is grounded directly in the knowledge you uploaded. If the AI doesn't know, it respectfully asks for contact info so a human can help."
            />
            
            <ul className="flex flex-col gap-5 mt-8">
              <li className="flex items-start gap-4">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                <span className="text-muted text-[16px] md:text-[18px]">No made-up prices or fake policies.</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                <span className="text-muted text-[16px] md:text-[18px]">Visible source citations for every claim.</span>
              </li>
              <li className="flex items-start gap-4">
                <ShieldAlert className="text-[#FFB800] shrink-0" size={24} />
                <span className="text-muted text-[16px] md:text-[18px]">Safe fallback to human takeover when unsure.</span>
              </li>
            </ul>
          </div>
          
        </div>
      </Container>
    </section>
  );
}
