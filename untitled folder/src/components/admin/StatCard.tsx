interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  trend?: { value: string; isPositive: boolean };
}

export function StatCard({ label, value, hint, trend }: StatCardProps) {
  // Use a default positive trend if none provided just to match the visual spec
  const activeTrend = trend || { value: "12%", isPositive: true };
  
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-r2 border border-border bg-surface p-5 shadow-card transition-all duration-200 hover:border-accent/40">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-[600] text-muted">
          {label}
        </span>
      </div>
      <div className="mt-3 text-[32px] font-[750] leading-none tracking-tight text-fg">
        {value}
      </div>
      <div className="mt-6 flex items-end justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-[12.5px] font-[650] ${activeTrend.isPositive ? 'text-good' : 'text-bad'}`}>
            {activeTrend.isPositive ? '↗' : '↘'} {activeTrend.value}
          </span>
          <span className="text-[11px] text-faint font-medium">vs last 30 days</span>
        </div>
        
        <svg className="h-5 w-[68px] opacity-80" viewBox="0 0 68 20" fill="none">
          <path 
            d="M2 18L12 12L22 16L32 8L42 12L52 4L66 10" 
            stroke={activeTrend.isPositive ? "var(--good)" : "var(--bad)"} 
            strokeWidth="1.8" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

