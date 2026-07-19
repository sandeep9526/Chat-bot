"use client";

import { useMemo } from "react";
import { OnboardingEmbedCode } from "./OnboardingEmbedCode";
import { DEFAULTS } from "@/lib/defaults";
import type { ZevaConfig } from "@/lib/types";
import type { WizardData } from "./types";

interface StepEmbedProps {
  data: WizardData;
  onBack: () => void;
  onNext: () => void;
}

export function StepEmbed({ data, onBack, onNext }: StepEmbedProps) {
  const config: ZevaConfig = useMemo(
    () => ({
      ...DEFAULTS,
      name: data.businessName || DEFAULTS.name,
      welcome: data.welcome || DEFAULTS.welcome,
      accent: data.accent,
      suggestions: data.suggestions.length ? data.suggestions : DEFAULTS.suggestions,
      launcher: data.launcher,
      anchor: data.anchor,
      offX: data.offX,
      offY: data.offY,
      label: `Ask ${data.businessName || DEFAULTS.name}`,
    }),
    [data],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-r2 border border-border bg-surface p-6 shadow-panel">
        <b className="text-base font-[750] text-fg">Get your embed code</b>
        <p className="mt-1 mb-5 text-[13px] text-muted">
          Paste this one line into your site&apos;s HTML — right before{" "}
          <code className="rounded-[5px] border border-border bg-panel px-1 font-mono text-[.92em]">
            {"</body>"}
          </code>{" "}
          works well on any site (WordPress, Shopify, plain HTML).
        </p>
        <OnboardingEmbedCode botId={data.botId} config={config} />
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
          Finish
        </button>
      </div>
    </div>
  );
}
