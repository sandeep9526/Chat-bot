"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CSSProperties, RefObject } from "react";
import { cn } from "@/lib/cn";
import { Launcher } from "./Launcher";
import { Panel } from "./Panel";
import { useDrag, computePlacement, computePosition } from "@/hooks/useDrag";
import { useZevaTheme } from "@/hooks/useZevaTheme";
import { useZevaStore } from "@/stores/zevaStore";
import { isLightColor } from "@/lib/color";

/**
 * Root of the Answer Engine widget. Owns open/closed + placement; renders the
 * launcher (when closed) and the panel. Config and session live in the Zustand
 * store, so the same component works in the studio preview and on /demo.
 */
interface ZevaWidgetProps {
  positionMode?: "fixed" | "absolute";
  /** Theme an ancestor element (e.g. a Studio preview stage) instead of
   *  <html>, so Surface/corners/font previewing never reskins a host page
   *  that has its own independent chrome (the operator dashboard). */
  themeScopeRef?: RefObject<HTMLElement | null>;
}

export function ZevaWidget({ positionMode = "fixed", themeScopeRef }: ZevaWidgetProps) {
  const config = useZevaStore((s) => s.config);
  const accentStrong = useZevaStore((s) => s.accentStrong);
  const isOpen = useZevaStore((s) => s.isOpen);
  const setOpen = useZevaStore((s) => s.setOpen);
  const setAnchor = useZevaStore((s) => s.setAnchor);
  const hydrateMessages = useZevaStore((s) => s.hydrateMessages);

  // Restore any in-progress conversation from this tab's session, once,
  // after mount — never during the initial render (see hydrateMessages).
  useEffect(() => {
    hydrateMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Surface / corners / font apply to `themeScopeRef` if given, else page-wide;
  // the accent always stays scoped to this widget root (below) so it never
  // recolours the host page/chrome.
  useZevaTheme(config, themeScopeRef);

  const rootRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(isOpen);
  const { isDragging, onPointerDown, onPointerMove, onPointerUp, consumeClick } =
    useDrag(setAnchor);

  // Disclosure-widget contract: closing the panel returns focus to the
  // control that opened it, so keyboard/screen-reader users don't lose their
  // place. The launcher only mounts once `isOpen` flips false, so the ref is
  // populated by the time this effect runs.
  useEffect(() => {
    if (wasOpen.current && !isOpen) launcherRef.current?.focus();
    wasOpen.current = isOpen;
  }, [isOpen]);

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
        "pointer-events-auto z-[60] flex w-[430px] max-w-[calc(100%-48px)] flex-col font-ui",
        positionMode,
        openDir === "down" && "flex-col-reverse",
        sideAlign === "start" ? "items-start" : "items-end",
        isOpen ? "gap-3" : "gap-0",
      )}

      // Runtime-dynamic values only: the picked accent (+ derived shades) and the
      // resolved drag/anchor position. Everything else is a token-based class.
      // The accent + its soft/ring derivations are set HERE (on the widget root)
      // rather than on <html>, so they colour only the widget — the soft/ring
      // vars re-derive from this element's --accent instead of the page default.
      // --on-accent is derived from the accent's own brightness, not the page
      // theme, so text on an accent-coloured surface stays legible no matter
      // how light or dark a brand colour the customer picks.
      style={
        {
          "--accent": config.accent,
          "--accent-strong": accentStrong,
          "--accent-soft": "color-mix(in srgb, var(--accent) 14%, transparent)",
          "--accent-ring": "color-mix(in srgb, var(--accent) 26%, transparent)",
          "--on-accent": isLightColor(config.accent) ? "#17171a" : "#ffffff",
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
          ref={launcherRef}
          label={config.label}
          variant={config.launcher}
          glass={config.glass}
          logo={config.logo}
          isDragging={isDragging}
          onClick={handleLauncherClick}
          onPointerDown={(e) => onPointerDown(e, rootRef.current, positionMode === "fixed")}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      )}
    </div>
  );
}
