import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { CheckCircle2, User } from "lucide-react";
import { SectionHead } from "./SectionHead";

export function ProductProof() {
  return (
    <section id="features" className="py-28 bg-bg border-t border-border relative font-sans">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="flex flex-col items-start xl:pr-8">
            <SectionHead
              eyebrow="Trust & Accuracy"
              title="Answers grounded in your business knowledge."
              description="Your AI only knows what you teach it. Every answer it provides can be traced directly back to the exact source document it learned from, so you never have to worry about hallucinations."
            />
          </div>

          <div className="w-full relative">
            <Reveal delay={100} className="relative rounded-2xl bg-surface border border-border p-5 sm:p-8 md:p-10 shadow-2xl w-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
              
              <div className="flex flex-col gap-8 relative z-10">
                {/* Visitor Message */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-panel flex items-center justify-center shrink-0">
                    <User size={20} className="text-muted" />
                  </div>
                  <div className="bg-panel border border-border text-fg text-[18px] px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm">
                    What's your cancellation policy?
                  </div>
                </div>
                
                {/* OchreShift Response */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FFB800] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,184,0,0.3)]">
                    <span className="text-black font-[800] text-[16px]">O</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="bg-transparent border border-border text-muted text-[18px] px-6 py-5 rounded-2xl rounded-tl-sm shadow-sm leading-relaxed">
                      Customers can cancel up to 24 hours before their appointment for a full refund. Cancellations made within 24 hours will incur a 50% fee.
                    </div>
                    
                    {/* Source Citation */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 w-fit mt-1">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-[14px] font-[600] text-emerald-500 tracking-wide">
                        Source: Cancellation Policy.pdf
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
          
        </div>
      </Container>
    </section>
  );
}
