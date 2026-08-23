"use client";

import { Reveal } from "./Reveal";
import { Scissors, Stethoscope, Briefcase, Wrench } from "lucide-react";
import { SectionHead } from "./SectionHead";

export function UseCases() {
  return (
    <section id="use-cases" className="usecases-section bg-bg py-24 border-t border-border font-sans">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-9">

        <SectionHead
          align="center"
          eyebrow="Industry Use Cases"
          title="Built for businesses where every unanswered question matters."
          description="Whether you're booking appointments or qualifying high-value clients, OchreShift turns conversations into revenue for service businesses."
          className="mb-16"
        />

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">

          {/* Card 1 */}
          <Reveal delay={200} className="h-full">
            <div className="bg-surface border border-border rounded-2xl p-8 md:p-10 hover:border-border hover:bg-surface transition-all flex flex-col h-full group shadow-lg">
              <div className="w-14 h-14 rounded-xl bg-panel border border-border flex items-center justify-center text-accent mb-8 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                <Scissors size={28} />
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-[700] text-muted uppercase tracking-widest mb-3">SALONS & SPAS</div>
                <h3 className="text-[22px] font-[700] text-fg mb-4 leading-tight">Turn price inquiries into bookings.</h3>
                <p className="text-[16px] text-muted leading-relaxed">
                  Answer questions about services and pricing instantly. When they are ready, capture their contact details for a confirmed appointment.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Card 2 */}
          <Reveal delay={250} className="h-full">
            <div className="bg-surface border border-border rounded-2xl p-8 md:p-10 hover:border-border hover:bg-surface transition-all flex flex-col h-full group shadow-lg">
              <div className="w-14 h-14 rounded-xl bg-panel border border-border flex items-center justify-center text-accent mb-8 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                <Stethoscope size={28} />
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-[700] text-muted uppercase tracking-widest mb-3">CLINICS & PRACTICES</div>
                <h3 className="text-[22px] font-[700] text-fg mb-4 leading-tight">Patient intake on autopilot.</h3>
                <p className="text-[16px] text-muted leading-relaxed">
                  Provide policy answers and intake forms securely. Capture new patient information before your front desk even opens.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Card 3 */}
          <Reveal delay={300} className="h-full">
            <div className="bg-surface border border-border rounded-2xl p-8 md:p-10 hover:border-border hover:bg-surface transition-all flex flex-col h-full group shadow-lg">
              <div className="w-14 h-14 rounded-xl bg-panel border border-border flex items-center justify-center text-accent mb-8 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                <Briefcase size={28} />
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-[700] text-muted uppercase tracking-widest mb-3">AGENCIES & CONSULTANCIES</div>
                <h3 className="text-[22px] font-[700] text-fg mb-4 leading-tight">Qualify high-value clients.</h3>
                <p className="text-[16px] text-muted leading-relaxed">
                  Filter out bad fits automatically. Ask qualifying questions about project budgets and scope before passing the lead to your team.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Card 4 */}
          <Reveal delay={350} className="h-full">
            <div className="bg-surface border border-border rounded-2xl p-8 md:p-10 hover:border-border hover:bg-surface transition-all flex flex-col h-full group shadow-lg">
              <div className="w-14 h-14 rounded-xl bg-panel border border-border flex items-center justify-center text-accent mb-8 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                <Wrench size={28} />
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-[700] text-muted uppercase tracking-widest mb-3">HOME SERVICES</div>
                <h3 className="text-[22px] font-[700] text-fg mb-4 leading-tight">Emergency dispatch & quotes.</h3>
                <p className="text-[16px] text-muted leading-relaxed">
                  Capture addresses, phone numbers, and urgent service requests immediately, so your team can dispatch the right person instantly.
                </p>
              </div>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
