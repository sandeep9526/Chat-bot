import { ArrowRightIcon } from "./icons";
import { MessageSquare, Code2, LineChart, CloudUpload } from "lucide-react";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";
import { Reveal } from "./Reveal";

export function ProductOverview() {
  return (
    <section id="product" className="bg-[#F8F8F6] section-normal">
      <div className="marketing-container">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          
          {/* Left: Copy */}
          <Reveal>
            <div>
              <span className="eyebrow">
                FOR DEVELOPERS, BY DEVELOPERS
              </span>
              <h2 className="mt-5 marketing-h2">
                Everything you need to build modern products{" "}
                <span className="text-[#F5A900]">faster.</span>
              </h2>
              <p className="mt-6 max-w-[42ch] text-[17px] leading-[1.65] text-[#475569]">
                Ochreshift is a powerful platform to build, deploy and scale AI-powered applications with developer-first tools and seamless integrations.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a href="/sign-up" className="btn-primary btn-shine">
                  Start Building
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </a>
                <a href="#features" className="btn-secondary">
                  Explore Features
                  <ArrowRightIcon className="h-4 w-4 text-[#475569] transition-transform duration-150 group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </Reveal>

          {/* Right: Platform Diagram */}
          <Reveal delay={150}>
            <div className="relative mx-auto w-full max-w-[560px] select-none py-8">
              {/* Connecting Lines */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 560 440"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M280 90 L280 175" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M280 350 L280 265" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M150 220 L200 220" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M410 220 L360 220" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
              </svg>

              {/* Central Node */}
              <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[20px] bg-[#08111F] shadow-2xl ring-1 ring-black/5">
                <OchreshiftLogo variant="mark" className="h-14 w-14" />
              </div>

              {/* Outer Nodes */}
              <div className="absolute left-1/2 top-0 flex w-[240px] -translate-x-1/2 items-start gap-4 rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-[#F8F8F6] text-[#475569]">
                  <MessageSquare strokeWidth={1.5} className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-[15px] font-[600] text-[#08111F]">AI Chat</h3>
                  <p className="mt-1 text-[13px] leading-tight text-[#64748B]">Smart conversations powered by AI</p>
                </div>
              </div>

              <div className="absolute bottom-0 left-1/2 flex w-[240px] -translate-x-1/2 items-start gap-4 rounded-[14px] border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-[#F8F8F6] text-[#475569]">
                  <LineChart strokeWidth={1.5} className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-[15px] font-[600] text-[#08111F]">Analytics</h3>
                  <p className="mt-1 text-[13px] leading-tight text-[#64748B]">Real-time insights and metrics</p>
                </div>
              </div>

              <div className="absolute left-0 top-1/2 flex w-[200px] -translate-y-1/2 items-center gap-4 rounded-[14px] border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-[#F8F8F6] text-[#475569]">
                  <Code2 strokeWidth={1.5} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-[600] text-[#08111F]">API</h3>
                  <p className="text-[12px] text-[#64748B]">RESTful APIs</p>
                </div>
              </div>

              <div className="absolute right-0 top-1/2 flex w-[200px] -translate-y-1/2 items-center gap-4 rounded-[14px] border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-[#F8F8F6] text-[#475569]">
                  <CloudUpload strokeWidth={1.5} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-[600] text-[#08111F]">Deploy</h3>
                  <p className="text-[12px] text-[#64748B]">One-click deploy</p>
                </div>
              </div>
              
              {/* Aspect ratio spacer */}
              <div className="pb-[78%]" />
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
