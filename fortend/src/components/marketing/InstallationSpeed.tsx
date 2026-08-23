import { Reveal } from "./Reveal";
import { Container } from "./Container";
import { UploadCloud, Code, Settings, Plus, ArrowRight, Play } from "lucide-react";
import { SectionHead } from "./SectionHead";

export function InstallationSpeed() {
  return (
    <section className="py-24 bg-bg border-t border-border font-sans">
      <Container>
        <SectionHead
          align="center"
          eyebrow="Setup Speed"
          title="Ready in minutes, not weeks."
          description="No complex integrations required. Set up your AI assistant instantly using your existing content."
          className="mb-16"
        />

        <div className="flex flex-col lg:flex-row items-center justify-center gap-3 lg:gap-4 max-w-[1240px] mx-auto">
          {/* Step 1 */}
          <Reveal delay={100} className="w-full lg:flex-1">
            <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 text-center h-full hover:bg-surface transition-colors">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-panel border border-border flex items-center justify-center text-[#FFB800] mx-auto mb-4 lg:mb-6 shadow-inner">
                <Plus size={24} />
              </div>
              <h3 className="text-[16px] lg:text-[18px] font-[700] text-fg mb-2">1. Create</h3>
              <p className="text-[13px] lg:text-[14px] text-muted leading-relaxed">Create your first agent.</p>
            </div>
          </Reveal>

          <Reveal delay={125} className="hidden lg:block">
            <ArrowRight className="text-slate-600 shrink-0" size={24} />
          </Reveal>

          <Reveal delay={125} className="block lg:hidden">
            <ArrowRight className="text-slate-600 rotate-90 my-1" size={24} />
          </Reveal>

          {/* Step 2 */}
          <Reveal delay={150} className="w-full lg:flex-1">
            <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 text-center h-full hover:bg-surface transition-colors">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-panel border border-border flex items-center justify-center text-[#FFB800] mx-auto mb-4 lg:mb-6 shadow-inner">
                <UploadCloud size={24} />
              </div>
              <h3 className="text-[16px] lg:text-[18px] font-[700] text-fg mb-2">2. Upload</h3>
              <p className="text-[13px] lg:text-[14px] text-muted leading-relaxed">Add business knowledge.</p>
            </div>
          </Reveal>

          <Reveal delay={175} className="hidden lg:block">
            <ArrowRight className="text-slate-600 shrink-0" size={24} />
          </Reveal>

          <Reveal delay={175} className="block lg:hidden">
            <ArrowRight className="text-slate-600 rotate-90 my-1" size={24} />
          </Reveal>

          {/* Step 3 */}
          <Reveal delay={200} className="w-full lg:flex-1">
            <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 text-center h-full hover:bg-surface transition-colors">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-panel border border-border flex items-center justify-center text-[#FFB800] mx-auto mb-4 lg:mb-6 shadow-inner">
                <Settings size={24} />
              </div>
              <h3 className="text-[16px] lg:text-[18px] font-[700] text-fg mb-2">3. Customize</h3>
              <p className="text-[13px] lg:text-[14px] text-muted leading-relaxed">Match your brand.</p>
            </div>
          </Reveal>

          <Reveal delay={225} className="hidden lg:block">
            <ArrowRight className="text-slate-600 shrink-0" size={24} />
          </Reveal>

          <Reveal delay={225} className="block lg:hidden">
            <ArrowRight className="text-slate-600 rotate-90 my-1" size={24} />
          </Reveal>

          {/* Step 4 */}
          <Reveal delay={250} className="w-full lg:flex-1">
            <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 text-center h-full hover:bg-surface transition-colors">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-panel border border-border flex items-center justify-center text-[#FFB800] mx-auto mb-4 lg:mb-6 shadow-inner">
                <Code size={24} />
              </div>
              <h3 className="text-[16px] lg:text-[18px] font-[700] text-fg mb-2">4. Paste Script</h3>
              <p className="text-[13px] lg:text-[14px] text-muted leading-relaxed">Add it to your site.</p>
            </div>
          </Reveal>

          <Reveal delay={275} className="hidden lg:block">
            <ArrowRight className="text-slate-600 shrink-0" size={24} />
          </Reveal>

          <Reveal delay={275} className="block lg:hidden">
            <ArrowRight className="text-slate-600 rotate-90 my-1" size={24} />
          </Reveal>

          {/* Step 5 */}
          <Reveal delay={300} className="w-full lg:flex-1">
            <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 text-center h-full hover:bg-surface transition-colors">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-panel border border-[#FFB800]/20 flex items-center justify-center text-[#FFB800] mx-auto mb-4 lg:mb-6 shadow-[0_0_15px_rgba(255,184,0,0.15)]">
                <Play size={24} className="ml-1" />
              </div>
              <h3 className="text-[16px] lg:text-[18px] font-[700] text-fg mb-2">5. Go Live</h3>
              <p className="text-[13px] lg:text-[14px] text-muted leading-relaxed">Start capturing leads.</p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
