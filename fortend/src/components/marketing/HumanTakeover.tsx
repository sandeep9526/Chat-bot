import { Reveal } from "./Reveal";
import { Container } from "./Container";
import { MessageSquare, Hand, User, Circle } from "lucide-react";
import { SectionHead } from "./SectionHead";

export function HumanTakeover() {
  return (
    <section className="py-24 bg-bg border-t border-border font-sans overflow-hidden">
      <Container>
        <div className="flex flex-col items-center">
          
          <SectionHead
            align="center"
            eyebrow="Seamless Handoff"
            title="AI handles the routine. You step in when it matters."
            description="Never lose the human touch. When a visitor needs personalized help or is ready to make a big purchase, OchreShift seamlessly hands the conversation over to you or your team."
            className="mb-16"
          />

          <div className="w-full relative max-w-5xl mx-auto">
            <Reveal delay={200} className="w-full">
               <div className="bg-surface rounded-2xl border border-border shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden w-full lg:min-h-[500px] flex flex-col md:flex-row relative">
                  
                  {/* Ambient Glow behind the UI */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

                  {/* Left Sidebar (Active Visitors / Alerts) */}
                  <div className="w-full md:w-[320px] border-b md:border-b-0 md:border-r border-border bg-bg/80 backdrop-blur-sm flex flex-col z-10 shrink-0">
                    <div className="p-5 border-b border-border flex items-center justify-between">
                      <span className="text-[12px] font-[700] text-slate-500 uppercase tracking-widest">
                        Live Inbox
                      </span>
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">1 Alert</span>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                      {/* Active Lead Alert */}
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex flex-col gap-3 cursor-pointer shadow-lg relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                        <div className="flex items-center justify-between">
                          <span className="text-[15px] font-[600] text-fg">John Smith</span>
                          <span className="text-[10px] text-orange-500 font-[800] px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-md uppercase tracking-wide">Hot</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[12px] font-semibold text-muted">john@example.com</span>
                          <span className="text-[12px] font-semibold text-muted">+1 555-0199</span>
                        </div>
                        <span className="text-[11px] text-blue-400 font-medium">Wait time: 2m • Requested human</span>
                      </div>
                      
                      {/* Idle Lead */}
                      <div className="rounded-lg p-4 flex flex-col gap-2 opacity-50 border border-transparent hover:border-border transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-[15px] font-[500] text-muted">Guest_4021</span>
                          <Circle size={8} className="text-emerald-500 fill-emerald-500" />
                        </div>
                        <span className="text-[12px] text-slate-500">Browsing pricing</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Chat Area */}
                  <div className="w-full flex-1 flex flex-col bg-surface/90 backdrop-blur-md z-10">
                    {/* Header */}
                    <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border flex items-center justify-between bg-panel">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-panel flex items-center justify-center">
                           <User size={18} className="text-muted" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[16px] font-[600] text-fg">John Smith</span>
                          <span className="text-[13px] text-muted">Viewing: Pricing page</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-[12px] text-orange-500 font-semibold uppercase tracking-wider">Attention Required</span>
                      </div>
                    </div>
                    
                    {/* Chat History */}
                    <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-y-auto min-h-[250px] sm:min-h-[300px]">
                      <div className="flex gap-4">
                         <div className="w-8 h-8 shrink-0" />
                         <div className="bg-panel border border-border text-muted text-[15px] px-5 py-4 rounded-2xl rounded-tl-sm w-fit max-w-[80%] leading-relaxed shadow-sm">
                           Do you handle emergency service calls on weekends? I'm ready to book.
                         </div>
                      </div>
                      <div className="flex gap-4 justify-end">
                         <div className="bg-panel border border-border text-muted text-[15px] px-5 py-4 rounded-2xl rounded-tr-sm w-fit max-w-[80%] text-right leading-relaxed shadow-sm">
                           <span className="font-bold text-[#FFB800] text-[11px] uppercase tracking-widest block mb-1">AI Assistant</span>
                           Yes, we offer 24/7 emergency service. Would you like to speak to someone right now?
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="w-8 h-8 shrink-0" />
                         <div className="bg-panel border border-border text-muted text-[15px] px-5 py-4 rounded-2xl rounded-tl-sm w-fit max-w-[80%] leading-relaxed shadow-sm">
                           Yes please.
                         </div>
                      </div>
                      
                      {/* System message */}
                      <div className="text-center my-4 relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-panel border border-border px-4 text-[11px] font-[700] text-muted uppercase tracking-widest rounded-full py-1 shadow-sm">
                            AI paused • Handoff requested
                          </span>
                        </div>
                      </div>
                      
                      {/* Human Typing Indicator */}
                      <div className="flex gap-4 justify-end">
                         <div className="bg-blue-600 border border-blue-500 text-white text-[15px] px-5 py-4 rounded-2xl rounded-tr-sm w-fit max-w-[80%] text-right shadow-sm flex items-center gap-2">
                           <span className="font-bold text-white/70 text-[11px] uppercase tracking-widest block">You</span>
                           Typing...
                         </div>
                      </div>
                    </div>
                    
                    {/* Take Over Action */}
                    <div className="p-4 sm:p-5 bg-bg border-t border-border">
                      <button className="w-full bg-blue-600 text-white font-[700] text-[15px] sm:text-[16px] py-3 sm:py-4 rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                         <Hand size={20} /> Take Over Conversation
                      </button>
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
