import { MessageSquare, Code2, Server, ShieldCheck, Terminal, Copy } from "lucide-react";
import { Reveal } from "./Reveal";

export function DeveloperFeatures() {
  return (
    <section className="bg-white section-normal">
      <div className="marketing-container">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1fr_1.3fr] lg:gap-24">
          
          {/* Left: Features List */}
          <Reveal>
            <div>
              <span className="eyebrow">
                FEATURES
              </span>
              <h2 className="mt-5 marketing-h2">
                Built for <span className="text-[#F5A900]">performance</span>{" "}
                and <span className="text-[#F5A900]">productivity</span>
              </h2>

              <div className="mt-12 flex flex-col gap-7">
                {[
                  { icon: MessageSquare, title: "AI-Powered Conversations", desc: "Integrate intelligent AI into your applications with ease. Give your users the answers they need, instantly." },
                  { icon: Code2, title: "Developer First", desc: "Clean APIs, solid documentation, and SDKs that just work. Spend less time reading docs and more time building." },
                  { icon: Server, title: "Scalable Infrastructure", desc: "Built on modern cloud infrastructure to scale with you, handling millions of requests with sub-second latency." },
                  { icon: ShieldCheck, title: "Secure by Design", desc: "Your data is protected with enterprise-grade security. We never use your data to train public models." },
                ].map((item, i) => (
                  <div key={i} className="group flex gap-5 rounded-[12px] p-4 -mx-4 transition-colors duration-200 hover:bg-[#F8F8F6]">
                    <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#F8F8F6] text-[#475569] transition-colors duration-200 group-hover:bg-[#F5A900]/10 group-hover:text-[#F5A900]">
                      <item.icon strokeWidth={1.5} className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-[600] text-[#08111F]">{item.title}</h3>
                      <p className="mt-1.5 text-[15px] leading-[1.6] text-[#475569]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Right: Code Editor Panel */}
          <Reveal delay={200} variant="zoom">
            <div className="relative">
              <div className="overflow-hidden rounded-[14px] bg-[#08111F] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] ring-1 ring-black/10">
                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-white/10 px-6 py-4">
                  <button className="text-[14px] font-[600] text-[#F5A900] border-b-2 border-[#F5A900] pb-[14px] -mb-[15px]">JavaScript</button>
                  <button className="text-[14px] font-[500] text-white/40 transition-colors hover:text-white/80 pb-[14px] -mb-[15px]">Python</button>
                  <button className="text-[14px] font-[500] text-white/40 transition-colors hover:text-white/80 pb-[14px] -mb-[15px]">cURL</button>
                </div>
                
                {/* Code Area */}
                <div className="p-6 font-mono text-[14px] sm:text-[15px] leading-[1.9]">
                  <div className="text-white/70 overflow-x-auto whitespace-pre pb-4">
                    <span className="text-[#F5A900]">import</span> {"{ OchreClient }"} <span className="text-[#F5A900]">from</span> <span className="text-[#16A34A]">'ochreshift'</span>;{"\n\n"}
                    <span className="text-[#F5A900]">const</span> client = <span className="text-[#F5A900]">new</span> OchreClient({"{\n"}
                    {"  "}apiKey: <span className="text-[#16A34A]">'YOUR_API_KEY'</span>{"\n"}
                    {"}"});{"\n\n"}
                    <span className="text-[#F5A900]">const</span> response = <span className="text-[#F5A900]">await</span> client.chat.create({"{\n"}
                    {"  "}message: <span className="text-[#16A34A]">'Hello, Ochreshift!'</span>{"\n"}
                    {"}"});{"\n\n"}
                    <span className="text-[#38bdf8]">console</span>.<span className="text-[#e2e8f0]">log</span>(response);
                  </div>
                </div>

                {/* Copy button bar */}
                <div className="flex items-center justify-end border-t border-white/5 px-6 py-3">
                  <button className="flex items-center gap-2 text-[12px] text-white/30 hover:text-white/60 transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                    Copy code
                  </button>
                </div>
              </div>

              {/* Floating Info Box */}
              <div className="absolute -bottom-7 -left-7 hidden sm:flex items-center gap-5 rounded-[14px] border border-[#E5E7EB] bg-white px-6 py-5 shadow-xl">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-[#F8F8F6] text-[#08111F]">
                  <Terminal strokeWidth={1.5} className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-[15px] font-[600] text-[#08111F]">Get started in minutes</h4>
                  <p className="text-[13px] text-[#475569]">Install the SDK and start building.</p>
                </div>
              </div>
            </div>
          </Reveal>
          
        </div>
      </div>
    </section>
  );
}
