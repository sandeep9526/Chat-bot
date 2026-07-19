interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
}

export function StatCard({ label, value, hint, accent }: StatCardProps) {
  return (
    <div className="rounded-r2 border border-border bg-surface p-4 shadow-card">
      <div className="text-[10.5px] font-[700] uppercase tracking-[.12em] text-faint">
        {label}
      </div>
      <div
        className={`mt-1.5 text-[30px] font-[750] leading-none ${
          accent ? "text-accent" : "text-fg"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-[11.5px] text-muted">{hint}</div>}
    </div>
  );
}
