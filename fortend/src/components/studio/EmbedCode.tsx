"use client";

import { useCallback } from "react";
import { Zap, ArrowRight } from "lucide-react";
import type { ZevaConfig } from "@/lib/types";

interface EmbedCodeProps {
  config: ZevaConfig;
}

export function EmbedCode({ config }: EmbedCodeProps) {
  const handleGoToInstall = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.hash = "#install";
    }
  }, []);

  return (
    <div className="mt-6 overflow-hidden rounded-[20px] border border-accent/30 bg-gradient-to-r from-surface via-surface to-accent/10 p-6 shadow-md transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/15 text-accent">
              <Zap className="h-4 w-4" />
            </span>
            <b className="text-[16px] font-[800] tracking-tight text-fg">
              Ready to launch your agent?
            </b>
          </div>
          <p className="mt-1 text-[13.5px] font-[500] text-muted max-w-[540px]">
            Your customized design is saved live. Get your 1-line HTML script tag, WordPress plugin, Shopify snippet, or React integration on the Install page.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoToInstall}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-accent px-5 py-3 text-[13.5px] font-[750] text-white shadow-md shadow-accent/25 transition-all hover:bg-accent-strong hover:scale-[1.02] active:scale-95"
        >
          <Zap className="h-4 w-4" /> Go to Install Page & Get Script <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
