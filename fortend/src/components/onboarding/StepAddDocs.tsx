"use client";

import { DocsUpload } from "@/components/admin/DocsUpload";

interface StepAddDocsProps {
  botId: string;
  onBack: () => void;
  onNext: () => void;
}

export function StepAddDocs({ botId, onBack, onNext }: StepAddDocsProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-r2 border border-border bg-surface p-6 shadow-panel">
        <b className="text-base font-[750] text-fg">Add your documents</b>
        <p className="mt-1 mb-5 text-[13px] text-muted">
          Paste your pricing, FAQ, hours, or policies below — the clearer the
          docs, the better your bot&apos;s answers. Add as many as you like;
          you can always add more later from your dashboard.
        </p>
        <DocsUpload botId={botId} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="cursor-pointer rounded-lg border border-border bg-panel px-4 py-2.5 font-medium text-fg transition-colors hover:border-accent"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="flex-1 cursor-pointer rounded-lg bg-accent py-2.5 font-medium text-white transition-colors hover:opacity-90"
          onClick={onNext}
        >
          Continue
        </button>
      </div>
      <p className="text-center text-[11.5px] text-faint">
        Docs are optional here — you can skip this and add them later.
      </p>
    </div>
  );
}
