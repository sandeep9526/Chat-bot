"use client";

import { useCallback, useRef, useState } from "react";
import type { Anchor } from "@/lib/types";

interface DragScratch {
  sx: number;
  sy: number;
  grabX: number;
  grabY: number;
  lw: number;
  lh: number;
  stage: DOMRect | null;
  moved: boolean;
}

/**
 * Pointer-based drag-to-place for the launcher. Placement is single-sourced in
 * the store, so this hook is a controller: on each move it computes the nearest
 * corner + offsets and `commit`s them (the widget re-positions from the store).
 * The stage bounds are the widget root's positioning ancestor (`offsetParent`);
 * the launcher is the pointer event's target — nothing is threaded through refs.
 * A move under 5px stays a click (opens the panel).
 */
export function useDrag(
  commit: (anchor: Anchor, offX: number, offY: number) => void,
) {
  const [isDragging, setIsDragging] = useState(false);
  // Synchronous flag so the click that trails a real drag can be swallowed.
  const draggedRef = useRef(false);

  const scratch = useRef<DragScratch>({
    sx: 0,
    sy: 0,
    grabX: 0,
    grabY: 0,
    lw: 0,
    lh: 0,
    stage: null,
    moved: false,
  });

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>, rootEl: HTMLElement | null) => {
      const launcher = e.currentTarget;
      const stageEl = (rootEl?.offsetParent ??
        rootEl?.parentElement) as HTMLElement | null;
      if (!stageEl) return;

      const lr = launcher.getBoundingClientRect();
      const s = scratch.current;
      s.stage = stageEl.getBoundingClientRect();
      s.sx = e.clientX;
      s.sy = e.clientY;
      s.grabX = e.clientX - lr.left;
      s.grabY = e.clientY - lr.top;
      s.lw = lr.width;
      s.lh = lr.height;
      s.moved = false;

      launcher.setPointerCapture(e.pointerId);
      setIsDragging(true);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const s = scratch.current;
      if (!s.stage) return;
      if (!s.moved && Math.hypot(e.clientX - s.sx, e.clientY - s.sy) < 5) return;
      s.moved = true;

      let lx = e.clientX - s.stage.left - s.grabX;
      let ly = e.clientY - s.stage.top - s.grabY;
      lx = Math.max(8, Math.min(lx, s.stage.width - s.lw - 8));
      ly = Math.max(8, Math.min(ly, s.stage.height - s.lh - 8));

      const cx = lx + s.lw / 2;
      const cy = ly + s.lh / 2;
      const h: "left" | "right" = cx > s.stage.width / 2 ? "right" : "left";
      const v: "top" | "bottom" = cy > s.stage.height / 2 ? "bottom" : "top";

      commit(
        `${v}-${h}` as Anchor,
        Math.round(h === "right" ? s.stage.width - (lx + s.lw) : lx),
        Math.round(v === "bottom" ? s.stage.height - (ly + s.lh) : ly),
      );
    },
    [commit],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const launcher = e.currentTarget;
    if (launcher.hasPointerCapture(e.pointerId)) {
      launcher.releasePointerCapture(e.pointerId);
    }
    draggedRef.current = scratch.current.moved;
    scratch.current.stage = null;
    setIsDragging(false);
  }, []);

  /** True if the click that just fired trailed a real drag (so swallow it). */
  const consumeClick = useCallback(() => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return true;
    }
    return false;
  }, []);

  return { isDragging, onPointerDown, onPointerMove, onPointerUp, consumeClick };
}

/** Panel alignment + open-direction from the anchor. */
export function computePlacement(anchor: Anchor) {
  const [v, h] = anchor.split("-") as ["top" | "bottom", "left" | "right"];
  return {
    sideAlign: (h === "left" ? "start" : "end") as "start" | "end",
    openDir: (v === "top" ? "down" : "up") as "up" | "down",
    v,
    h,
  };
}

/** CSS positioning (left/right/top/bottom in px) from anchor + offsets. */
export function computePosition(
  anchor: Anchor,
  offX: number,
  offY: number,
): React.CSSProperties {
  const [v, h] = anchor.split("-") as ["top" | "bottom", "left" | "right"];
  return {
    left: h === "left" ? offX : "auto",
    right: h === "right" ? offX : "auto",
    top: v === "top" ? offY : "auto",
    bottom: v === "bottom" ? offY : "auto",
  };
}
