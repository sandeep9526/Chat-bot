"use client";

import { useRef, useState } from "react";
import { Upload, Check, FileText, Trash2 } from "lucide-react";
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
      <b className="text-sm font-[750]">Add knowledge (docs)</b>
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
        className={`tap flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-r1 border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragging
            ? "border-accent bg-accent/[0.05]"
            : "border-border bg-panel/40 hover:border-accent-ring"
        }`}
      >
        <Upload className="h-6 w-6 text-faint" strokeWidth={1.8} />
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
      <div className="mt-4 border-t border-border pt-4">
        <span className="text-[12.5px] font-[650] text-fg block mb-1">
          Or paste text directly
        </span>
        <input
          type="text"
          placeholder="Filename (e.g. info.txt)"
          aria-label="Filename"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          className="mb-2 w-full rounded-r1 border border-border bg-panel px-3 py-1.5 text-[12.5px] text-fg outline-none focus:border-accent"
        />
        <textarea
          rows={3}
          className="w-full rounded-r1 border border-border bg-panel p-3 text-[12.5px] text-fg outline-none focus:border-accent font-mono"
          placeholder="Business info, pricing, FAQ, timings… the clearer the text, the better the answers."
          aria-label="Knowledge text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {pasteError && (
          <p className="mt-2 rounded-r1 bg-warn/10 px-3 py-2 text-[12.5px] text-warn">
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
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-good">
              <Check className="h-3.5 w-3.5" /> Saved — {ingest.data.chunks} chunks indexed
            </span>
          )}
          {ingest.isError && (
            <span className="text-[12.5px] text-warn">
              {ingest.error instanceof AdminApiError
                ? ingest.error.message
                : "Couldn't save that text — check your connection and try again."}
            </span>
          )}
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="mt-6 border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <b className="text-[13px] font-[750] text-fg">Uploaded documents ({docs.length})</b>
          {docsLoading && <span className="text-[11px] text-faint">Loading docs...</span>}
        </div>

        {docsError ? (
          <div className="rounded-r1 bg-warn/10 p-3 text-[12.5px] text-warn">
            Couldn&apos;t load your documents — check your connection.{" "}
            <button type="button" onClick={() => refetchDocs()} className="font-[700] underline">
              Retry
            </button>
          </div>
        ) : docs.length === 0 ? (
          <p className="text-[12px] text-faint italic bg-panel p-3 rounded-r1">
            No documents uploaded yet for this bot. Upload a file above or select an industry template.
          </p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.filename}
                className="flex items-center justify-between gap-3 rounded-r1 border border-border bg-panel p-3 text-[12.5px] transition-colors hover:border-accent/30"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-r1 bg-accent/15 text-accent">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <b className="block truncate font-[680] text-fg text-[13px]">
                      {doc.filename}
                    </b>
                    <span className="block text-[11px] text-faint">
                      {doc.chars.toLocaleString()} chars · {(doc.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmDeleteName(doc.filename)}
                  disabled={deleteDoc.isPending}
                  className="tap inline-flex shrink-0 items-center gap-1 rounded-r1 border border-bad/30 bg-bad/10 px-2.5 py-1 text-[11px] font-[700] text-bad transition-colors hover:bg-bad hover:text-white disabled:opacity-40"
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
