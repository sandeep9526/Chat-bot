"use client";

import { MessageSquare, Users, CheckCircle, Star, ArrowUpRight, BarChart3, FileText, Palette, Plug, Settings, HelpCircle } from "lucide-react";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";
import { Reveal } from "./Reveal";
import { useEffect, useRef, useState } from "react";

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboardIcon, label: "Overview", active: true },
  { icon: MessageSquare, label: "Conversations" },
  { icon: Users, label: "Leads" },
  { icon: FileText, label: "Knowledge" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Palette, label: "Appearance" },
  { icon: Plug, label: "Install" },
  { icon: Settings, label: "Settings" },
  { icon: HelpCircle, label: "Help & Support" },
];

export function DashboardPreview() {
  return (
    <section className="bg-[#F8F8F6] section-normal overflow-hidden">
      <div className="marketing-container">
        
        <Reveal>
          <div className="text-center max-w-[560px] mx-auto mb-14">
            <span className="eyebrow">
              ANALYTICS &amp; INSIGHTS
            </span>
            <h2 className="mt-5 marketing-h2">
              Everything you need <br /> in one dashboard.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={150} variant="zoom">
          <div className="relative mx-auto w-full max-w-[1120px]">
            <div className="overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-[#F8F8F6] shadow-[0_20px_60px_-20px_rgba(8,17,31,0.15)] ring-1 ring-black/5 flex h-[560px] sm:h-[620px]">
              
              {/* Sidebar (Dark Navy) */}
              <div className="w-[220px] shrink-0 bg-[#08111F] text-white flex flex-col border-r border-white/10 hidden sm:flex">
                <div className="h-16 flex items-center px-5 border-b border-white/5">
                  <OchreshiftLogo className="h-5 w-auto opacity-90" />
                </div>
                <div className="p-3 flex-1">
                  <div className="space-y-0.5">
                    {SIDEBAR_ITEMS.map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[13px] font-[500] transition-colors ${
                          item.active
                            ? "bg-[#F5A900]/10 text-[#F5A900]"
                            : "text-white/40 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1e293b] text-[12px] font-[600] text-white">
                      A
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-[500] text-white/90">Admin</span>
                      <span className="text-[11px] text-[#16A34A]">Pro Plan</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {/* Top Nav */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-[#E5E7EB]">
                  <span className="text-[16px] font-[600] text-[#08111F]">Overview</span>
                  <div className="h-9 w-9 rounded-full bg-[#F8F8F6] border border-[#E5E7EB] flex items-center justify-center text-[13px] font-[600] text-[#475569]">
                    A
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 overflow-y-auto bg-[#F8F8F6]/50 flex-1">
                  
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Total Conversations", value: "1,248", icon: MessageSquare, trend: "+18.6%" },
                      { label: "Leads Captured", value: "312", icon: Users, trend: "+24.7%" },
                      { label: "Resolution Rate", value: "89%", icon: CheckCircle, trend: "+14.3%" },
                      { label: "Satisfaction", value: "4.8/5", icon: Star, trend: "+8.4%" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-white rounded-[12px] p-5 border border-[#E5E7EB]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#F8F8F6] text-[#475569]">
                            <kpi.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
                          </div>
                          <div className="flex items-center gap-1 text-[12px] font-[600] text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded-full">
                            <ArrowUpRight className="h-3 w-3" />
                            {kpi.trend}
                          </div>
                        </div>
                        <div className="text-[28px] font-[700] text-[#08111F] leading-none">{kpi.value}</div>
                        <div className="text-[13px] font-[500] text-[#64748B] mt-2">{kpi.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Main Chart */}
                  <div className="bg-white rounded-[12px] p-6 border border-[#E5E7EB] mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[15px] font-[600] text-[#08111F]">Conversations Overview</h3>
                      <select className="text-[13px] border border-[#E5E7EB] rounded-[8px] px-3 py-1.5 text-[#475569] bg-transparent outline-none">
                        <option>Last 30 Days</option>
                      </select>
                    </div>
                    
                    <AnimatedChart />
                  </div>

                  {/* Bottom Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-[12px] p-6 border border-[#E5E7EB]">
                      <h3 className="text-[15px] font-[600] text-[#08111F] mb-5">Top Questions</h3>
                      <div className="space-y-4">
                        {[
                          { q: "What is the pricing?", count: 142 },
                          { q: "How do I integrate the API?", count: 89 },
                          { q: "Do you support Python?", count: 64 },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-[14px]">
                            <span className="font-[500] text-[#475569] truncate max-w-[75%]">{item.q}</span>
                            <span className="text-[12px] font-[600] text-[#F5A900] bg-[#F5A900]/10 px-2.5 py-1 rounded-full">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-[12px] p-6 border border-[#E5E7EB]">
                      <h3 className="text-[15px] font-[600] text-[#08111F] mb-5">Recent Leads</h3>
                      <div className="space-y-4">
                        {[
                          { email: "sarah@example.com", time: "2h ago" },
                          { email: "alex.m@company.co", time: "4h ago" },
                          { email: "founders@startup.io", time: "5h ago" },
                        ].map((lead, i) => (
                          <div key={i} className="flex items-center justify-between text-[14px]">
                            <span className="font-[500] text-[#475569]">{lead.email}</span>
                            <span className="text-[13px] text-[#94a3b8]">{lead.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Animated SVG chart line that draws in when visible */
function AnimatedChart() {
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const linePath = "M0,75 Q12,70 20,55 T40,45 T60,28 T80,38 T100,18";

  return (
    <div className="h-[180px] w-full relative">
      {/* Y-axis grid */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-full border-t border-[#E5E7EB]/60 border-dashed" />
        ))}
      </div>
      <svg ref={ref} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5A900" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#F5A900" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path 
          d={`${linePath} L100,100 L0,100 Z`}
          fill="url(#chartGrad)" 
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.6s" }}
        />
        <path 
          d={linePath}
          fill="none" 
          stroke="#F5A900" 
          strokeWidth="2" 
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 300,
            strokeDashoffset: visible ? 0 : 300,
            transition: "stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      {/* X-axis labels */}
      <div className="absolute bottom-0 translate-y-full pt-2 flex w-full justify-between text-[12px] text-[#94a3b8]">
        <span>1st</span><span>8th</span><span>15th</span><span>22nd</span><span>30th</span>
      </div>
    </div>
  );
}

function LayoutDashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}
