"use client";

import type { WizardData } from "./types";

interface StepDoneProps {
  data: WizardData;
  onRestart: () => void;
}

export function StepDone({ data, onRestart }: StepDoneProps) {
  return (
    <div className="rounded-r2 border border-border bg-surface p-8 text-center shadow-panel">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-good/15 text-good">
        <CheckIcon className="h-7 w-7" />
      </div>
      <b className="text-xl font-[750] text-fg">
        {data.businessName || "Your bot"} is ready
      </b>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] text-muted">
        Bot ID <code className="rounded-[5px] border border-border bg-panel px-1.5 py-0.5 font-mono text-[.92em] text-fg">{data.botId}</code>{" "}
        is live. Paste the script tag on your site to go live — visitors will
        see your widget right away.
      </p>

      <p className="mx-auto mt-3 max-w-md text-[12.5px] text-muted">
        Want to change the colour, welcome message, or suggested questions?{" "}
        <a
          href={`/studio?bot=${encodeURIComponent(data.botId)}`}
          className="font-[650] text-accent hover:underline"
        >
          Customize it in Studio
        </a>{" "}
        anytime.
      </p>

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href="/dashboard"
          className="w-full cursor-pointer rounded-lg bg-accent px-6 py-2.5 text-center font-medium text-white transition-colors hover:opacity-90 sm:w-auto"
        >
          Go to your dashboard
        </a>
        <button
          type="button"
          className="w-full cursor-pointer rounded-lg border border-border bg-panel px-6 py-2.5 font-medium text-fg transition-colors hover:border-accent sm:w-auto"
          onClick={onRestart}
        >
          Set up another bot
        </button>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
