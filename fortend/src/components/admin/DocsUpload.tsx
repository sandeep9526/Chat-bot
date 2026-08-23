"use client";

import { useRef, useState } from "react";
import { Upload, Check, FileText, Trash2, CloudUpload, FileCode, CheckCircle2 } from "lucide-react";
import { useIngestDoc, useIngestFile, useDocs, useDeleteDoc } from "@/hooks/useAdmin";
import { AdminApiError } from "@/lib/adminApi";
import { markSetupDone } from "@/lib/setupProgress";
import { ConfirmDialog } from "./ConfirmDialog";
import { SitemapCrawlerConsole } from "./SitemapCrawlerConsole";

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
  const suspicious = (sample.match(/[\x00-\x08\x0E-\x1F]/g) || []).length;
  return sample.length > 0 && suspicious / sample.length > 0.02;
}

/** Lets a customer add their own knowledge — file upload (PDF/Word/text/MD/PNG/JPG) or pasted text. */
export function DocsUpload({ botId }: { botId: string }) {
  const [filename, setFilename] = useState("info.txt");
  const [text, setText] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [fileError, setFileError] = useState("");
  const [fileMsg, setFileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ingest = useIngestDoc();
  const upload = useIngestFile();
  const { data: docs = [], isLoading: docsLoading, isError: docsError, refetch: refetchDocs } = useDocs(botId);
  const deleteDoc = useDeleteDoc();

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
      } catch (err: any) {
        if (err?.status === 404 || (err?.message && err.message.includes("not found"))) {
           localStorage.removeItem("zeva-onboarding-draft");
           setFileError("Bot not found on server (it may have been created during a connection error). The draft has been cleared. Please refresh the page to start over.");
        } else {
           setFileMsg({
             ok: false,
             text: err instanceof AdminApiError ? err.message : `Couldn't read "${file.name}".`,
           });
        }
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submitPaste = () => {
    setPasteError("");
    if (!text.trim()) return;
    if (looksLikeBinary(text)) {
      setPasteError("This doesn't look like text — it may be corrupted or a binary file.");
      return;
    }
    ingest.mutate(
      { botId, filename: filename || "info.txt", text },
      {
        onSuccess: () => {
          markSetupDone(botId, "knowledge");
          setText("");
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!confirmDeleteName) return;
    deleteDoc.mutate(
      { botId, filename: confirmDeleteName },
      { onSettled: () => setConfirmDeleteName(null) },
    );
  };

  const busyName = upload.isPending
    ? (upload.variables as { file?: File } | undefined)?.file?.name
    : undefined;

  return (
    <div className="rounded-r2 border border-border bg-surface p-4 shadow-card">
      <b className="text-sm font-[750]">Add knowledge</b>
      <p className="mt-0.5 mb-3 text-[12px] text-muted">
        Upload a file or paste text. Your agent answers only from what you add here.
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
        className={`tap relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 overflow-hidden ${
          dragging
            ? "border-accent bg-accent/[0.08] shadow-[0_0_20px_rgba(var(--color-accent),0.1)] scale-[1.01]"
            : "border-border/60 bg-surface hover:border-accent/50 hover:bg-surface"
        }`}
      >
        <div className={`absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 transition-opacity duration-300 ${dragging ? 'opacity-100' : 'group-hover:opacity-100'}`} />
        <div className={`grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent transition-transform duration-300 ${dragging ? 'scale-110' : ''}`}>
          <CloudUpload className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <b className="mt-1 text-[13.5px] font-[650] text-fg z-10">Click to upload or drag a file here</b>
        <span className="text-[12px] text-muted z-10 max-w-[280px]">
          Accepts PDF, Word, TXT, Markdown, PNG, or JPG (up to {MAX_MB}MB)
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
        <p className="mt-2 flex items-center gap-2 rounded-r1 bg-panel px-3 py-2 text-[12.5px] text-muted">
          <span className="h-2 w-2 animate-blink rounded-full bg-accent" />
          Reading {busyName ? `“${busyName}”` : "your file"}…
          {busyName && /\.(png|jpe?g)$/i.test(busyName) ? " (reading the image can take a few seconds)" : ""}
        </p>
      )}
      {!upload.isPending && fileMsg && (
        <p
          className={`mt-2 flex items-center gap-1.5 rounded-r1 px-3 py-2 text-[12.5px] ${
            fileMsg.ok ? "bg-good/10 text-good" : "bg-warn/10 text-warn"
          }`}
        >
          {fileMsg.ok && <Check className="h-3.5 w-3.5 shrink-0" />}
          {fileMsg.text}
        </p>
      )}
      {fileError && (
        <p className="mt-2 rounded-r1 bg-warn/10 px-3 py-2 text-[12.5px] text-warn">
          {fileError}
        </p>
      )}

      {/* Manual text paste fallback */}
      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="grid h-6 w-6 place-items-center rounded bg-zinc-500/10 text-zinc-500">
            <FileCode className="h-3.5 w-3.5" />
          </div>
          <span className="text-[13px] font-[650] text-fg">
            Or paste text directly
          </span>
        </div>
        
        <div className="overflow-hidden rounded-xl border border-border bg-surface focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20 transition-all">
          <div className="border-b border-border bg-panel px-3 py-2">
            <input
              type="text"
              placeholder="Filename (e.g. info.txt)"
              aria-label="Filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full bg-transparent text-[12px] font-mono text-fg outline-none placeholder:text-muted"
            />
          </div>
          <textarea
            rows={4}
            className="w-full resize-y bg-transparent p-3 text-[12.5px] text-fg outline-none font-mono placeholder:text-muted/60"
            placeholder="Paste business info, pricing, FAQs, timings… the clearer the text, the better the agent's answers."
            aria-label="Knowledge text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {pasteError && (
          <p className="mt-2 rounded-lg bg-warn/10 px-3 py-2 text-[12px] text-warn">
            {pasteError}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {ingest.isSuccess && (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved — {ingest.data.chunks} chunks indexed
              </span>
            )}
            {ingest.isError && (
              <span className="text-[12px] font-medium text-warn bg-warn/10 px-2.5 py-1 rounded-md">
                {ingest.error instanceof AdminApiError
                  ? ingest.error.message
                  : "Couldn't save that text — check your connection and try again."}
              </span>
            )}
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-accent px-4 py-1.5 text-[12.5px] font-[650] text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
            onClick={submitPaste}
            disabled={!text.trim() || ingest.isPending}
          >
            {ingest.isPending ? "Saving…" : "Save & re-index"}
          </button>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="mt-6 border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <b className="text-[13px] font-[750] text-fg">Uploaded documents ({docs.length})</b>
          {docsLoading && <span className="text-[11px] text-faint">Loading docs...</span>}
        </div>

        {docsError ? (
          <div className="rounded-lg bg-warn/10 p-3 text-[12.5px] text-warn">
            Couldn&apos;t load your documents — check your connection.{" "}
            <button type="button" onClick={() => refetchDocs()} className="font-[700] underline">
              Retry
            </button>
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-surface/30 py-8 text-center">
            <FileText className="mb-2 h-6 w-6 text-faint" />
            <span className="text-[13px] font-[600] text-fg">No documents uploaded</span>
            <span className="mt-1 max-w-[250px] text-[12px] text-muted">Upload a file or paste text above to teach your agent.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {docs.map((doc) => (
              <div
                key={doc.filename}
                className="group relative flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-surface p-3 transition-all hover:border-accent/30 hover:shadow-sm overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent/20 group-hover:bg-accent transition-colors" />
                <div className="flex items-center gap-3 min-w-0 pl-1.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-accent/10 text-accent">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <b className="block truncate font-[650] text-fg text-[13px]">
                      {doc.filename}
                    </b>
                    <span className="block text-[11px] text-muted mt-0.5">
                      {doc.chars.toLocaleString()} chars · {(doc.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmDeleteName(doc.filename)}
                  disabled={deleteDoc.isPending}
                  className="tap inline-flex shrink-0 items-center gap-1.5 rounded-md border border-transparent px-2.5 py-1.5 text-[11px] font-[650] text-muted transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Autonomous Sitemap Crawler Console */}
      <SitemapCrawlerConsole botId={botId} onCrawlComplete={() => refetchDocs()} />

      {confirmDeleteName && (
        <ConfirmDialog
          title={`Delete "${confirmDeleteName}"?`}
          body="The AI memory for this file will be removed. This can't be undone."
          confirmLabel="Delete document"
          busy={deleteDoc.isPending}
          onCancel={() => setConfirmDeleteName(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
