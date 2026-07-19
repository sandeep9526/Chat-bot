"use client";

import { useRef, useState } from "react";
import { useIngestDoc, useIngestFile } from "@/hooks/useAdmin";
import { AdminApiError } from "@/lib/adminApi";
import { markSetupDone } from "@/lib/setupProgress";

// What the file picker accepts. The backend extracts text from each: documents
// via parsers (pypdf / python-docx), images via a vision model.
const ACCEPT =
  ".pdf,.docx,.txt,.md,.markdown,.png,.jpg,.jpeg," +
  "application/pdf," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "text/plain,text/markdown,image/png,image/jpeg";
const MAX_MB = 12;

// The pasted-text path still guards against someone pasting binary junk — the
// file path doesn't need this (the server extracts real text from the file).
const BINARY_SIGNATURES = ["PK", "%PDF", "\x89PNG", "GIF8", "\xFF\xD8\xFF", "MZ"];
function looksLikeBinary(text: string): boolean {
  if (BINARY_SIGNATURES.some((sig) => text.startsWith(sig))) return true;
  const sample = text.slice(0, 4000);
  const suspicious = (sample.match(/[�\x00-\x08\x0E-\x1F]/g) || []).length;
  return sample.length > 0 && suspicious / sample.length > 0.02;
}

/** Client apni docs daale — file upload (PDF/Word/text/MD/PNG/JPG) ya text paste. */
export function DocsUpload({ botId }: { botId: string }) {
  const [filename, setFilename] = useState("info.txt");
  const [text, setText] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [fileError, setFileError] = useState("");
  const [fileMsg, setFileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const ingest = useIngestDoc();
  const upload = useIngestFile();

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFileError("");
    setFileMsg(null);
    // One at a time — extraction (esp. images via the vision model) is the slow
    // part, and sequential keeps the status message honest about what's running.
    for (const file of Array.from(files)) {
      if (file.size > MAX_MB * 1024 * 1024) {
        setFileError(`"${file.name}" is too big — max ${MAX_MB}MB.`);
        continue;
      }
      try {
        const r = await upload.mutateAsync({ botId, file });
        markSetupDone(botId, "knowledge");
        setFileMsg({
          ok: true,
          text: `Added ${r.filename} — ${r.chars.toLocaleString()} characters, ${r.chunks} chunk${r.chunks === 1 ? "" : "s"} indexed`,
        });
      } catch (e) {
        setFileMsg({
          ok: false,
          text: e instanceof AdminApiError ? e.message : `Couldn't read "${file.name}".`,
        });
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submitPaste = () => {
    setPasteError("");
    if (!text.trim()) return;
    if (looksLikeBinary(text)) {
      setPasteError("Ye content text nahi lag raha — binary/corrupted data lagta hai.");
      return;
    }
    ingest.mutate(
      { botId, filename: filename || "info.txt", text },
      { onSuccess: () => markSetupDone(botId, "knowledge") },
    );
  };

  const busyName = upload.isPending
    ? (upload.variables as { file?: File } | undefined)?.file?.name
    : undefined;

  return (
    <div className="rounded-r2 border border-border bg-surface p-4 shadow-panel">
      <b className="text-sm font-[750]">Add knowledge (docs)</b>
      <p className="mt-0.5 mb-3 text-[12px] text-muted">
        Upload a file or paste text. Your bot answers only from what you add here.
      </p>

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFiles(e.dataTransfer.files);
        }}
        className={`tap flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-r1 border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragging
            ? "border-accent bg-accent/[0.05]"
            : "border-border bg-panel/40 hover:border-accent-ring"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-faint" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4M7 9l5-5 5 5" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        <b className="text-[13px] font-[680] text-fg">Click to upload or drag a file here</b>
        <span className="text-[11.5px] text-faint">
          PDF, Word, text, Markdown, PNG or JPG · up to {MAX_MB}MB
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => uploadFiles(e.target.files)}
      />

      {/* File upload status */}
      {upload.isPending && (
        <p className="mt-2 flex items-center gap-2 rounded-[8px] bg-panel px-3 py-2 text-[12.5px] text-muted">
          <span className="h-2 w-2 animate-blink rounded-full bg-accent" />
          Reading {busyName ? `“${busyName}”` : "your file"}…
          {busyName && /\.(png|jpe?g)$/i.test(busyName) ? " (reading the image can take a few seconds)" : ""}
        </p>
      )}
      {!upload.isPending && fileMsg && (
        <p
          className={`mt-2 rounded-[8px] px-3 py-2 text-[12.5px] ${
            fileMsg.ok ? "bg-good/10 text-good" : "bg-amber-500/10 text-amber-600"
          }`}
        >
          {fileMsg.ok ? "✓ " : ""}
          {fileMsg.text}
        </p>
      )}
      {fileError && (
        <p className="mt-2 rounded-[8px] bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-600">
          {fileError}
        </p>
      )}

      {/* Divider */}
      <div className="my-4 flex items-center gap-3 text-[11px] font-[600] uppercase tracking-[.12em] text-faint">
        <span className="h-px flex-1 bg-border" />
        or paste text
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Paste-text path */}
      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded-[9px] border border-border bg-surface px-[11px] py-2 font-ui text-[13px] text-fg outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="filename (e.g. pricing.txt)"
        />
      </div>

      <textarea
        className="mt-2 h-32 w-full resize-none rounded-[9px] border border-border bg-surface px-[11px] py-2 font-ui text-[13px] leading-[1.5] text-fg outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring"
        placeholder="Business info, pricing, FAQ, timings… (jitna saaf, utne ache jawab)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {pasteError && (
        <p className="mt-2 rounded-[8px] bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-600">
          {pasteError}
        </p>
      )}

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          className="cursor-pointer rounded-r1 bg-accent px-4 py-2 font-ui text-[13px] font-[700] text-white disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onClick={submitPaste}
          disabled={!text.trim() || ingest.isPending}
        >
          {ingest.isPending ? "Saving…" : "Save & re-index"}
        </button>
        {ingest.isSuccess && (
          <span className="text-[12.5px] text-good">
            ✓ Saved — {ingest.data.chunks} chunks indexed
          </span>
        )}
        {ingest.isError && (
          <span className="text-[12.5px] text-amber-500">Failed — backend chal raha hai?</span>
        )}
      </div>
    </div>
  );
}
