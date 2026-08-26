import { Reveal } from "./Reveal";
import { Container } from "./Container";
import { Flame, Target, Thermometer, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SectionHead } from "./SectionHead";

export function LeadQualification() {
  return (
    <div className="font-sans overflow-hidden pt-8">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left Text */}
          <div className="flex flex-col items-start xl:pr-8">
            <SectionHead
              eyebrow="Buying Intent Scoring"
              title="Know exactly who is ready to buy."
              description="Not every visitor is a buyer. OchreShift analyzes every conversation to detect buying signals, captures their contact info, and scores them automatically. Focus your energy on the Hot leads."
            />

            <div className="flex flex-col gap-5 w-full mt-10">
              <div className="flex items-center gap-5 bg-surface border border-border p-5 rounded-xl transition-all hover:bg-surface">
                <Flame size={28} className="text-orange-500 shrink-0" />
                <div>
                  <h4 className="font-[700] text-fg text-[16px] mb-1">Hot Lead</h4>
                  <p className="text-[14px] text-muted leading-snug">Ready to purchase, requested human, or provided email.</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-surface border border-border p-5 rounded-xl transition-all hover:bg-surface">
                <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500" />
                </div>
                <div>
                  <h4 className="font-[700] text-fg text-[16px] mb-1">Warm Lead</h4>
                  <p className="text-[14px] text-muted leading-snug">Asking specific pricing or availability questions.</p>
                </div>
              </div>
              <div className="flex items-center gap-5 bg-surface border border-border p-5 rounded-xl transition-all hover:bg-surface">
                <Thermometer size={28} className="text-blue-400 shrink-0" />
                <div>
                  <h4 className="font-[700] text-fg text-[16px] mb-1">Cold Lead</h4>
                  <p className="text-[14px] text-muted leading-snug">General browsing or simple policy questions.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="w-full relative">
            <Reveal delay={200} className="w-full">
              <div className="bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden w-full max-w-lg mx-auto lg:max-w-none">
                <div className="bg-panel px-6 py-5 border-b border-border flex items-center justify-between">
                  <span className="font-[600] text-fg flex items-center gap-2.5 text-[15px]">
                    <Target size={20} className="text-muted" />
                    New Lead Captured
                  </span>
                  <span className="text-[13px] text-muted font-[500]">Just now</span>
                </div>
                <div className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-[28px] font-bold text-fg leading-none">John Smith</h3>
                      <p className="text-[16px] text-muted mt-1">john@example.com</p>
                      <p className="text-[16px] text-muted">+1 555-0199</p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/30 text-orange-500 px-4 py-2 rounded-lg font-bold text-[14px] flex items-center gap-1.5 tracking-wide">
                      <Flame size={16} /> HOT
                    </div>
                  </div>

                  <div className="bg-bg rounded-xl p-5 border border-border mb-8">
                    <span className="text-[13px] font-[700] text-faint uppercase tracking-widest mb-3 block">AI Summary</span>
                    <p className="text-[16px] text-muted leading-relaxed">
                      Needs emergency service tomorrow and asked about pricing. High intent.
                    </p>
                  </div>

                  <Link
                    href="/demo"
                    className="w-full bg-fg text-bg font-[700] text-[16px] py-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    View conversation <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </Container>
    </div>
  );
}
