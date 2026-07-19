"use client";

import { useCallback, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { Launcher } from "./Launcher";
import { Panel } from "./Panel";
import { useDrag, computePlacement, computePosition } from "@/hooks/useDrag";
import { useZevaTheme } from "@/hooks/useZevaTheme";
import { useZevaStore } from "@/stores/zevaStore";

/**
 * Root of the Answer Engine widget. Owns open/closed + placement; renders the
 * launcher (when closed) and the panel. Config and session live in the Zustand
 * store, so the same component works in the studio preview and on /demo.
 */
export function ZevaWidget() {
  const config = useZevaStore((s) => s.config);
  const accentStrong = useZevaStore((s) => s.accentStrong);
  const isOpen = useZevaStore((s) => s.isOpen);
  const setOpen = useZevaStore((s) => s.setOpen);
  const setAnchor = useZevaStore((s) => s.setAnchor);

  // Surface / corners / font apply page-wide; the accent stays scoped to this
  // widget root (below) so it never recolours the host page.
  useZevaTheme(config);

  const rootRef = useRef<HTMLDivElement>(null);
  const { isDragging, onPointerDown, onPointerMove, onPointerUp, consumeClick } =
    useDrag(setAnchor);

  const { sideAlign, openDir } = useMemo(
    () => computePlacement(config.anchor),
    [config.anchor],
  );
  const position = useMemo(
    () => computePosition(config.anchor, config.offX, config.offY),
    [config.anchor, config.offX, config.offY],
  );

  const handleLauncherClick = useCallback(() => {
    if (consumeClick()) return; // a click that trailed a real drag — ignore
    setOpen(true);
  }, [consumeClick, setOpen]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "pointer-events-auto absolute z-[60] flex w-[430px] max-w-[calc(100%-48px)] flex-col font-ui",
        openDir === "down" && "flex-col-reverse",
        sideAlign === "start" ? "items-start" : "items-end",
        isOpen ? "gap-3" : "gap-0",
      )}
      // Runtime-dynamic values only: the picked accent (+ derived shades) and the
      // resolved drag/anchor position. Everything else is a token-based class.
      // The accent + its soft/ring derivations are set HERE (on the widget root)
      // rather than on <html>, so they colour only the widget — the soft/ring
      // vars re-derive from this element's --accent instead of the page default.
      style={
        {
          "--accent": config.accent,
          "--accent-strong": accentStrong,
          "--accent-soft": "color-mix(in srgb, var(--accent) 14%, transparent)",
          "--accent-ring": "color-mix(in srgb, var(--accent) 26%, transparent)",
          "--panel-bg": config.panelBg,
          ...position,
        } as CSSProperties
      }
    >
      <Panel
        sideAlign={sideAlign}
        openDir={openDir}
        isOpen={isOpen}
        onClose={() => setOpen(false)}
      />

      {!isOpen && (
        <Launcher
          label={config.label}
          variant={config.launcher}
          glass={config.glass}
          logo={config.logo}
          isDragging={isDragging}
          onClick={handleLauncherClick}
          onPointerDown={(e) => onPointerDown(e, rootRef.current)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      )}
    </div>
  );
}
