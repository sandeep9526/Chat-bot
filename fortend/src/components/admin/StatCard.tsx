interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
}

export function StatCard({ label, value, hint, accent }: StatCardProps) {
  return (
    <div className={`group relative overflow-hidden rounded-r2 border p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover ${
      accent
        ? "border-accent/30 bg-gradient-to-br from-accent/10 via-surface to-surface"
        : "border-border/80 bg-surface hover:border-accent/40"
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-[750] uppercase tracking-[.14em] text-muted">
          {label}
        </span>
        {accent && <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />}
      </div>
      <div
        className={`mt-2 text-[32px] font-[800] leading-none tracking-tight ${
          accent ? "text-accent" : "text-fg"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-2 text-[12px] font-[550] text-muted">{hint}</div>}
    </div>
  );
}

