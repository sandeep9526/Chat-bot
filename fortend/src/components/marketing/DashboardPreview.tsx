"use client";

import { MessageSquare, Users, CheckCircle, TrendingUp } from "lucide-react";
import { Reveal } from "./Reveal";
import { useEffect, useRef, useState } from "react";

export function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
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

  return (
    <section className="bg-[#F8F8F6] section-normal overflow-hidden">
      <div className="marketing-container">
        
        <Reveal>
          <div className="text-center max-w-[520px] mx-auto mb-14">
            <p className="eyebrow mx-auto">DASHBOARD</p>
            <h2 className="mt-4 marketing-h2">
              Know what your customers want.
            </h2>
          </div>
        </Reveal>

        {/* KPI strip */}
        <Reveal delay={100}>
          <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-[960px] mx-auto">
            {[
              { label: "Conversations", value: 1248, icon: MessageSquare, suffix: "" },
              { label: "Leads captured", value: 312, icon: Users, suffix: "" },
              { label: "Resolution rate", value: 89, icon: CheckCircle, suffix: "%" },
              { label: "Avg. satisfaction", value: 4.8, icon: TrendingUp, suffix: "/5" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-[14px] p-6 border border-[rgba(0,0,0,0.06)] text-center">
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-[10px] bg-[#F8F8F6] text-[#475569]">
                  <kpi.icon className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <div className="mt-4 text-[30px] font-[700] text-bg leading-none tracking-[-0.02em] tabular-nums">
                  <CountUp target={kpi.value} active={visible} />
                  {kpi.suffix}
                </div>
                <div className="mt-2 text-[13px] font-[500] text-[#64748B]">{kpi.label}</div>
              </div>
            ))}
          </div>
        </Reveal>

      </div>
    </section>
  );
}

function CountUp({ target, active }: { target: number; active: boolean }) {
  const [value, setValue] = useState(0);
  const decimals = target % 1 !== 0 ? 1 : 0;

  useEffect(() => {
    if (!active) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);

  return <>{value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}
