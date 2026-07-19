"use client";

import { useEffect, useState } from "react";
import {
  SETUP_EVENT,
  type SetupStep,
  getSetupFlags,
  isSetupDismissed,
  dismissSetup,
} from "@/lib/setupProgress";

/* Live view of a bot's setup flags + dismissed state. Re-reads on the custom
 * setup event (a step completed anywhere in the app) and on cross-tab storage
 * changes. The first read is deferred a frame so it isn't a sync effect setState. */
function useSetupState(botId: string) {
  const [flags, setFlags] = useState(() => getSetupFlags(botId));
  const [dismissed, setDismissed] = useState(() => isSetupDismissed(botId));

  useEffect(() => {
    const read = () => {
      setFlags(getSetupFlags(botId));
      setDismissed(isSetupDismissed(botId));
    };
    const raf = requestAnimationFrame(read); // re-read when botId changes
    window.addEventListener(SETUP_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(SETUP_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, [botId]);

  return { flags, dismissed };
}

type StepDef = {
  key: "create" | SetupStep;
  title: string;
  desc: string;
  cta: string;
  needsBot: boolean;
};

const STEPS: StepDef[] = [
  {
    key: "create",
    title: "Create your first bot",
    desc: "Give it a name and a colour — it takes about a minute.",
    cta: "Create a bot",
    needsBot: false,
  },
  {
    key: "knowledge",
    title: "Add your knowledge",
    desc: "Upload docs, FAQs or prices. Your bot answers only from these.",
    cta: "Add knowledge",
    needsBot: true,
  },
  {
    key: "customize",
    title: "Make it yours",
    desc: "Set the colour, welcome message and suggested questions.",
    cta: "Open Studio",
    needsBot: true,
  },
  {
    key: "install",
    title: "Install on your site",
    desc: "Copy your snippet and paste it once before </body>.",
    cta: "Get snippet",
    needsBot: true,
  },
];

/**
 * First-run setup checklist. Guides a new owner through getting their first bot
 * live — create → add knowledge → customize → install. Every tick is a *real*
 * completed action (the bots list, a doc ingest, a Studio save, a snippet copy),
 * so progress is never faked. Hides itself once complete-and-dismissed. Renders
 * only on the Overview / Bots screens (see AdminDashboard).
 */
export function SetupChecklist({
  hasBots,
  botId,
  onCreateBot,
  onGoto,
  onOpenStudio,
}: {
  hasBots: boolean;
  botId: string;
  onCreateBot: () => void;
  onGoto: (section: string) => void;
  onOpenStudio: () => void;
}) {
  const { flags, dismissed } = useSetupState(botId);

  const isDone = (s: StepDef) => (s.key === "create" ? hasBots : !!flags[s.key]);
  const doneCount = STEPS.filter(isDone).length;
  const allDone = doneCount === STEPS.length;

  if (dismissed) return null;

  const act = (key: StepDef["key"]) => {
    if (key === "create") onCreateBot();
    else if (key === "customize") onOpenStudio();
    else onGoto(key); // knowledge | install
  };

  // The single next action to emphasise (first incomplete, actionable step).
  const nextKey = STEPS.find((s) => !isDone(s) && (!s.needsBot || hasBots))?.key;

  return (
    <div className="mb-6 overflow-hidden rounded-r2 border border-border bg-surface shadow-panel">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <b className="text-[14.5px] font-[780] text-fg">
            {allDone ? "You’re all set 🎉" : "Get your bot live"}
          </b>
          <p className="mt-0.5 text-[12.5px] text-muted">
            {allDone
              ? "Nice — your bot is ready to help your visitors."
              : "A few quick steps and you’ll be answering visitors automatically."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-[12px] font-[700] text-faint">
            {doneCount}/{STEPS.length}
          </span>
          <button
            type="button"
            onClick={() => dismissSetup(botId)}
            aria-label="Dismiss setup checklist"
            className="tap grid h-7 w-7 place-items-center rounded-r1 text-faint transition-colors hover:bg-panel hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-panel">
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-accent to-accent-strong transition-[width] duration-500"
          style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
        />
      </div>

      <ol className="flex flex-col divide-y divide-border">
        {STEPS.map((s, i) => {
          const done = isDone(s);
          const locked = s.needsBot && !hasBots;
          const isNext = s.key === nextKey;
          return (
            <li
              key={s.key}
              className={`flex items-center gap-3.5 px-5 py-3.5 ${isNext ? "bg-accent/[0.04]" : ""}`}
            >
              {/* Status badge */}
              <span
                className={
                  done
                    ? "grid h-6 w-6 shrink-0 place-items-center rounded-full bg-good/15 text-good"
                    : `grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-[700] ${
                        isNext
                          ? "border-accent-ring bg-accent/10 text-accent"
                          : "border-border text-faint"
                      }`
                }
              >
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>

              {/* Label */}
              <div className="min-w-0 flex-1">
                <div className={`text-[13.5px] font-[680] ${done ? "text-muted line-through decoration-border" : "text-fg"}`}>
                  {s.title}
                </div>
                {!done && <div className="mt-0.5 text-[12px] text-muted">{s.desc}</div>}
              </div>

              {/* Action */}
              {!done &&
                (isNext ? (
                  <button
                    type="button"
                    onClick={() => act(s.key)}
                    className="tap shrink-0 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-3 py-1.5 text-[12.5px] font-[680] text-white shadow-panel transition-opacity hover:opacity-90"
                  >
                    {s.cta}
                  </button>
                ) : locked ? (
                  <span className="shrink-0 text-[11.5px] font-[600] text-faint">Up next</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => act(s.key)}
                    className="tap shrink-0 rounded-r1 border border-border bg-panel px-3 py-1.5 text-[12.5px] font-[650] text-fg transition-colors hover:border-accent hover:text-accent"
                  >
                    {s.cta}
                  </button>
                ))}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
