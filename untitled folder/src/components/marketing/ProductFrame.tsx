import {
  MessageSquare,
  LayoutDashboard,
  Key,
  Settings,
  HelpCircle,
  Plus,
  Send,
  MoreVertical,
  Code2,
  FileText,
  BarChart3,
  Plug
} from "lucide-react";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";

export function ProductFrame() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-[720px] select-none"
    >
      {/* Decorative hexagonal nodes/lines */}
      <div className="absolute -right-20 top-1/2 -z-10 hidden -translate-y-1/2 lg:block">
        <svg
          width="220"
          height="420"
          viewBox="0 0 220 420"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 210h90l45-110h65M90 210l45 110h65"
            stroke="url(#hero-grad)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <rect x="86" y="206" width="8" height="8" rx="2" fill="#F5A900" />
          <rect x="131" y="96" width="8" height="8" rx="2" fill="#F5A900" />
          <rect x="131" y="316" width="8" height="8" rx="2" fill="#F5A900" />
          
          <rect x="200" y="80" width="16" height="16" rx="4" fill="#0b172a" stroke="rgba(245,169,0,0.3)" />
          <path d="M204 88l4 3-4 3" stroke="#F5A900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M212 91h4" stroke="#F5A900" strokeWidth="1.5" strokeLinecap="round"/>

          <rect x="200" y="320" width="16" height="16" rx="4" fill="#0b172a" stroke="rgba(245,169,0,0.3)" />
          <path d="M204 328h8v8h-8z" stroke="#F5A900" strokeWidth="1" fill="none"/>

          <defs>
            <linearGradient id="hero-grad" x1="0" y1="210" x2="220" y2="210" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgba(245, 169, 0, 0)" />
              <stop offset="0.5" stopColor="rgba(245, 169, 0, 0.35)" />
              <stop offset="1" stopColor="rgba(245, 169, 0, 0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-white/10 bg-[#08111F] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
        
        {/* Title Bar */}
        <div className="flex items-center border-b border-white/5 px-5 py-3.5">
          <div className="flex w-[220px] shrink-0 items-center">
            <OchreshiftLogo className="h-5 w-auto opacity-90" />
          </div>
          <div className="flex flex-1 items-center justify-between pl-4">
            <span className="text-[13px] font-[500] text-white/80">New Conversation</span>
            <div className="flex items-center gap-4 text-white/40">
              <MoreVertical className="h-4 w-4" />
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Interface Layout */}
        <div className="flex h-[440px] bg-[#0b172a]">
          
          {/* Sidebar */}
          <div className="flex w-[230px] shrink-0 flex-col border-r border-white/5 bg-[#08111F]">
            <div className="p-3">
              <button className="flex w-full items-center gap-2.5 rounded-[8px] bg-white/5 px-3.5 py-2.5 text-[13px] font-[500] text-white/90 transition-colors hover:bg-white/10">
                <Plus className="h-4 w-4 text-[#F5A900]" />
                New Chat
              </button>
            </div>
            
            <nav className="flex-1 space-y-0.5 px-3 pt-2">
              {[
                { icon: LayoutDashboard, label: "Dashboard" },
                { icon: MessageSquare, label: "Conversations", active: true },
                { icon: FileText, label: "Knowledge Base" },
                { icon: Key, label: "API Keys" },
                { icon: BarChart3, label: "Analytics" },
                { icon: Plug, label: "Integrations" },
                { icon: Settings, label: "Settings" },
                { icon: HelpCircle, label: "Help" },
              ].map((item) => (
                <button
                  key={item.label}
                  className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-[13px] font-[500] transition-colors ${
                    item.active
                      ? "bg-white/10 text-white"
                      : "text-white/45 hover:bg-white/5 hover:text-white/85"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="border-t border-white/5 p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1e293b] text-[12px] font-[600] text-white">
                  D
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-[500] text-white/90">Developer</span>
                  <span className="text-[11px] text-[#16A34A]">Pro Plan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex flex-1 flex-col relative overflow-hidden">
            {/* Faint grid background */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            <div className="relative z-10 flex flex-1 flex-col gap-6 overflow-y-auto p-6 pt-8">
              {/* User Message */}
              <div className="self-end rounded-[14px] rounded-tr-[4px] bg-[#273248] px-5 py-3 text-[14px] leading-relaxed text-white/90 max-w-[80%]">
                How can I integrate the Ochreshift API?
              </div>

              {/* AI Response */}
              <div className="self-start text-[14px] leading-[1.65] text-white/75 max-w-[88%] space-y-4">
                <p>
                  You can integrate the Ochreshift API by making a POST request to our endpoint with your API key in the header.
                </p>
                
                {/* Code Block */}
                <div className="overflow-hidden rounded-[10px] border border-white/10 bg-[#08111F] font-mono text-[13px]">
                  <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 text-white/40">
                    <span className="flex items-center gap-2"><Code2 className="h-3.5 w-3.5" /> cURL</span>
                    <button className="text-[11px] hover:text-white/70 transition-colors">Copy</button>
                  </div>
                  <div className="p-4 text-white/65 overflow-x-auto whitespace-pre">
                    <span className="text-[#F5A900]">POST</span> https://api.ochreshift.dev/v1/chat{"\n\n"}
                    <span className="text-[#94a3b8]">Headers:</span>{"\n"}
                    Authorization: Bearer <span className="text-white">YOUR_API_KEY</span>{"\n"}
                    Content-Type: application/json{"\n\n"}
                    <span className="text-[#94a3b8]">Body:</span>{"\n"}
                    {"{"}{"\n"}
                    {"  "}"message": <span className="text-[#16A34A]">"Hello, Ochreshift!"</span>{"\n"}
                    {"}"}
                  </div>
                </div>
              </div>
            </div>

            {/* Composer */}
            <div className="relative z-10 p-4 pt-0">
              <div className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-[#08111F] px-4 py-3 ring-1 ring-transparent transition-all focus-within:border-[#F5A900]/50 focus-within:ring-[#F5A900]/20">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/25"
                  readOnly
                />
                <button className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-[#F5A900] text-[#08111F] transition-transform hover:scale-105">
                  <Send className="h-4 w-4 -ml-[1px]" />
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
