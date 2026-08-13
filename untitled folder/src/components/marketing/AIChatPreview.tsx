"use client";

import { SourceCheckIcon, ArrowRightIcon } from "./icons";
import { FileText, Globe, BookOpen } from "lucide-react";
import { Reveal } from "./Reveal";

export function AIChatPreview() {
  return (
    <section className="bg-[#08111F] section-normal overflow-hidden relative">
      {/* Subtle glow */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F5A900]/[0.04] blur-[180px]" />
      
      <div className="marketing-container relative z-10">
        <Reveal>
          <div className="text-center max-w-[560px] mx-auto">
            <span className="eyebrow">
              AI ASSISTANT
            </span>
            <h2 className="mt-5 marketing-h2 text-white">
              Answers backed by <br /> your actual data.
            </h2>
            <p className="mt-5 text-[17px] leading-[1.65] text-white/55">
              Every response includes direct citations to your connected knowledge base, ensuring trust and accuracy.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200} variant="zoom">
          <div className="mt-14 mx-auto w-full max-w-[860px]">
            <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#0D1727] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
              {/* Header */}
              <div className="flex items-center gap-4 border-b border-white/5 bg-[#0b152a] px-6 py-5">
                <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#F5A900] text-[#08111F]">
                  <SourceCheckIcon strokeWidth={1.5} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[15px] font-[600] text-white">Ochreshift AI Assistant</p>
                  <p className="flex items-center gap-2 text-[13px] text-white/40">
                    <span className="h-2 w-2 rounded-full bg-[#16A34A]" /> Always online
                  </p>
                </div>
              </div>
              
              {/* Chat Area */}
              <div className="flex flex-col gap-6 p-6 sm:p-8">
                
                {/* User Message */}
                <div className="self-end rounded-[14px] rounded-tr-[4px] bg-[#1a2540] px-6 py-4 text-[15px] text-white/80 max-w-[75%]">
                  What are the pricing plans for the Pro tier?
                </div>

                {/* AI Response */}
                <div className="self-start w-full max-w-[85%]">
                  <div className="rounded-[14px] rounded-tl-[4px] border border-white/5 bg-[#08111F] px-6 py-6 text-[15px] leading-[1.65] text-white/65">
                    <p>
                      Our Pro tier costs $49/month when billed annually, or $59/month when billed monthly. It includes:
                    </p>
                    <ul className="mt-4 space-y-2 list-disc pl-6 text-white/55 text-[14px]">
                      <li>Unlimited knowledge base syncing</li>
                      <li>Up to 5 team members</li>
                      <li>Priority support</li>
                      <li>Advanced analytics and custom branding</li>
                    </ul>
                    
                    {/* Sources */}
                    <div className="mt-6 border-t border-white/8 pt-5">
                      <p className="text-[12px] font-[600] uppercase tracking-wider text-white/30 mb-3">
                        Sources
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        {[
                          { icon: FileText, label: "Pricing-Guide.pdf" },
                          { icon: Globe, label: "Pricing Page" },
                          { icon: BookOpen, label: "Documentation" },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-white/55 transition-colors hover:bg-white/10 cursor-pointer">
                            <s.icon strokeWidth={1.5} className="h-3.5 w-3.5 text-[#F5A900]" /> {s.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Composer */}
              <div className="border-t border-white/5 bg-[#0b152a] p-5">
                <div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-[#08111F] px-5 py-3.5 transition-colors focus-within:border-[#F5A900]/40">
                  <input
                    type="text"
                    placeholder="Ask a question..."
                    className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/25"
                    readOnly
                  />
                  <button className="flex items-center justify-center shrink-0 h-9 w-9 rounded-full bg-[#F5A900] text-[#08111F] transition-transform hover:scale-105">
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
