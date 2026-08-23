"use client";

import { useEffect, type ReactNode } from "react";
import { Trash2 as TrashIcon } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Themed stand-in for window.confirm() — every destructive action in the
 *  admin panel (delete bot, delete lead, delete doc) should route through
 *  this instead of the browser's native dialog so the experience is
 *  consistent and on-brand. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel = "Delete",
  busyLabel = "Deleting…",
  busy = false,
  error,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-[420px] rounded-r3 border border-border bg-surface p-6 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid h-11 w-11 place-items-center rounded-r2 bg-bad/12 text-bad">
          <TrashIcon className="h-5 w-5" />
        </div>
        <h2 id="confirm-dialog-title" className="mt-4 text-[17px] font-[750] text-fg">
          {title}
        </h2>
        <div className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{body}</div>
        {error && (
          <p role="alert" className="mt-3 text-[13px] leading-relaxed text-bad">
            {error}
          </p>
        )}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-r1 border border-border bg-surface px-4 py-2.5 text-[13.5px] font-[650] text-fg hover:bg-panel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-r1 bg-bad px-5 py-2.5 text-[13.5px] font-[650] text-white transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
