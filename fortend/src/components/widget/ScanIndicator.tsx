"use client";

const SHIMMER =
  "h-[9px] rounded-[5px] bg-gradient-to-r from-ring via-accent-soft to-ring bg-[length:200%_100%]";

/** The "searching your knowledge" scan shimmer shown while the answer loads. */
export function ScanIndicator() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-[7px] font-mono text-[11.5px] text-muted">
        <span className="h-[7px] w-[7px] rounded-full bg-accent motion-safe:animate-blink" />
        searching your knowledge…
      </div>
      <div className={`${SHIMMER} w-[92%] motion-safe:animate-sweep`} />
      <div className={`${SHIMMER} w-[74%] motion-safe:animate-scan-delayed-1`} />
      <div className={`${SHIMMER} w-[84%] motion-safe:animate-scan-delayed-2`} />
    </div>
  );
}
