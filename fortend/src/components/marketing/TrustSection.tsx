import { Reveal } from "./Reveal";
import { Container } from "./Container";
import { Lock, Shield, Server } from "lucide-react";
import { SectionHead } from "./SectionHead";

export function TrustSection() {
  return (
    <section className="py-28 bg-bg border-t border-border font-sans">
      <Container>
        <SectionHead
          align="center"
          eyebrow="Security & Privacy"
          title="Your business knowledge stays separated."
          description="We take data privacy seriously. Your documents and customer conversations are strictly isolated and never mixed with other businesses."
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Reveal delay={100}>
            <div className="flex flex-col items-center text-center bg-surface border border-border rounded-2xl p-8 hover:bg-surface transition-colors h-full">
              <div className="w-14 h-14 rounded-full bg-panel border border-border flex items-center justify-center text-emerald-500 mb-6 shadow-inner">
                <Lock size={28} />
              </div>
              <h3 className="font-[700] text-[20px] text-fg mb-3">Isolated Knowledge</h3>
              <p className="text-[16px] text-muted leading-relaxed">Your uploaded PDFs, menus, and internal docs are siloed. They are never used to train public AI models.</p>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="flex flex-col items-center text-center bg-surface border border-border rounded-2xl p-8 hover:bg-surface transition-colors h-full">
              <div className="w-14 h-14 rounded-full bg-panel border border-border flex items-center justify-center text-emerald-500 mb-6 shadow-inner">
                <Shield size={28} />
              </div>
              <h3 className="font-[700] text-[20px] text-fg mb-3">Secure Lead Capture</h3>
              <p className="text-[16px] text-muted leading-relaxed">Customer contact information is securely encrypted and delivered only to your designated team members.</p>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-col items-center text-center bg-surface border border-border rounded-2xl p-8 hover:bg-surface transition-colors h-full">
              <div className="w-14 h-14 rounded-full bg-panel border border-border flex items-center justify-center text-emerald-500 mb-6 shadow-inner">
                <Server size={28} />
              </div>
              <h3 className="font-[700] text-[20px] text-fg mb-3">Data Control</h3>
              <p className="text-[16px] text-muted leading-relaxed">You retain full control over your data. Delete your account or documents at any time, with no hidden retention.</p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
