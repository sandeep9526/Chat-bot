"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Database,
  Sparkles,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Globe,
  FileText,
  HelpCircle,
  FileCode,
  Trash2,
  Eye,
  Check,
  Copy,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  CloudUpload,
  ArrowRight,
  CheckSquare,
  Square,
  MinusSquare,
  Upload,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDocs,
  useDocContent,
  useDeleteDoc,
  useIngestDoc,
  useIngestFile,
} from "@/hooks/useAdmin";
import { AdminApiError, type AdminDoc, type AdminStats } from "@/lib/adminApi";
import { cn } from "@/lib/cn";
import { ConfirmDialog } from "./ConfirmDialog";

const ACCEPT =
  ".pdf,.docx,.txt,.md,.markdown,.png,.jpg,.jpeg," +
  "application/pdf," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "text/plain,text/markdown,image/png,image/jpeg";
const MAX_MB = 12;

type ActiveTab = "sources" | "gaps";
type IngestTab = "files" | "web" | "faq" | "text";
type DocSort = "chars" | "size" | "name";

interface KnowledgeSectionProps {
  botId: string;
  stats?: AdminStats;
  onNavigateToPlayground?: () => void;
}

// Clean title formatter for raw server filenames
function formatDocDisplay(filename: string): {
  title: string;
  subtitle: string;
  type: "web" | "file" | "faq";
} {
  if (filename.startsWith("url__") || filename.includes("sitemap")) {
    const slug = filename.replace(/^url__/, "").replace(/\.txt$/, "").replace(/_/g, " ");
    const title =
      slug === "home"
        ? "Home Page"
        : slug
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    return {
      title: title || "Web Page",
      subtitle: `Web Source (${filename})`,
      type: "web",
    };
  }
  if (filename.startsWith("faq_")) {
    const slug = filename.replace(/^faq_/, "").replace(/\.txt$/, "").replace(/_/g, " ");
    const title = slug.charAt(0).toUpperCase() + slug.slice(1);
    return {
      title: title || "Q&A Override",
      subtitle: "Verified Answer",
      type: "faq",
    };
  }
  return {
    title: filename,
    subtitle: "Uploaded Document",
    type: "file",
  };
}

export function KnowledgeSection({
  botId,
  stats,
  onNavigateToPlayground,
}: KnowledgeSectionProps) {
  const queryClient = useQueryClient();
  const { data: docs = [], isLoading: docsLoading, refetch: refetchDocs } = useDocs(botId);
  const deleteDoc = useDeleteDoc();
  const ingestDoc = useIngestDoc();
  const uploadFile = useIngestFile();

  // Navigation View: Grounded Sources vs Unanswered Inquiries
  const [activeTab, setActiveTab] = useState<ActiveTab>("sources");

  // Ingestion Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [ingestTab, setIngestTab] = useState<IngestTab>("files");

  // Document Filtering, Search & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "web" | "file" | "faq">("all");
  const [docSort, setDocSort] = useState<DocSort>("chars");
  const [docPage, setDocPage] = useState(1);
  const DOCS_PER_PAGE = 8;

  // Multi-select state
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Document Reader Drawer
  const [inspectDoc, setInspectDoc] = useState<AdminDoc | null>(null);

  // Delete confirm for single doc
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);

  // Ingestion form states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlMsg, setCrawlMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  const [rawTitle, setRawTitle] = useState("");
  const [rawText, setRawText] = useState("");

  // Unanswered Questions (Knowledge Gaps) Interactive Resolver
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionPage, setQuestionPage] = useState(1);
  const QUESTIONS_PER_PAGE = 6;
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [inquiryAnswer, setInquiryAnswer] = useState("");
  const [answeredMap, setAnsweredMap] = useState<Record<string, boolean>>({});
  const [dismissedMap, setDismissedMap] = useState<Record<string, boolean>>({});

  // Reset pagination on filter change
  useEffect(() => {
    setDocPage(1);
  }, [searchQuery, typeFilter, docSort]);

  useEffect(() => {
    setQuestionPage(1);
  }, [questionSearch]);

  // Aggregate Metrics
  const totalChars = useMemo(() => {
    return docs.reduce((acc, d) => acc + (d.chars || 0), 0);
  }, [docs]);

  // Filtered & Sorted documents
  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const meta = formatDocDisplay(doc.filename);
      if (typeFilter !== "all" && meta.type !== typeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        doc.filename.toLowerCase().includes(q) ||
        meta.title.toLowerCase().includes(q)
      );
    });
  }, [docs, typeFilter, searchQuery]);

  const sortedDocs = useMemo(() => {
    return [...filteredDocs].sort((a, b) => {
      if (docSort === "chars") return (b.chars || 0) - (a.chars || 0);
      if (docSort === "size") return (b.size || 0) - (a.size || 0);
      const nameA = formatDocDisplay(a.filename).title;
      const nameB = formatDocDisplay(b.filename).title;
      return nameA.localeCompare(nameB);
    });
  }, [filteredDocs, docSort]);

  const totalDocPages = Math.max(1, Math.ceil(sortedDocs.length / DOCS_PER_PAGE));
  const currentDocs = useMemo(() => {
    const start = (docPage - 1) * DOCS_PER_PAGE;
    return sortedDocs.slice(start, start + DOCS_PER_PAGE);
  }, [sortedDocs, docPage]);

  // Counts for filter pills
  const counts = useMemo(() => {
    let web = 0;
    let file = 0;
    let faq = 0;
    docs.forEach((d) => {
      const t = formatDocDisplay(d.filename).type;
      if (t === "web") web++;
      else if (t === "file") file++;
      else if (t === "faq") faq++;
    });
    return { web, file, faq };
  }, [docs]);

  // Unanswered Questions logic
  const unaddressedQuestions = useMemo(() => {
    const raw = (stats?.topQuestions ?? []).filter(
      (q) => !answeredMap[q.question] && !dismissedMap[q.question]
    );
    if (!questionSearch.trim()) return raw;
    return raw.filter((q) =>
      q.question.toLowerCase().includes(questionSearch.toLowerCase())
    );
  }, [stats?.topQuestions, answeredMap, dismissedMap, questionSearch]);

  const totalUnaddressedCount = (stats?.topQuestions ?? []).filter(
    (q) => !answeredMap[q.question] && !dismissedMap[q.question]
  ).length;

  const totalQuestionPages = Math.max(
    1,
    Math.ceil(unaddressedQuestions.length / QUESTIONS_PER_PAGE)
  );
  const currentQuestions = useMemo(() => {
    const start = (questionPage - 1) * QUESTIONS_PER_PAGE;
    return unaddressedQuestions.slice(start, start + QUESTIONS_PER_PAGE);
  }, [unaddressedQuestions, questionPage]);

  // Multi-select handlers
  const allCurrentSelected =
    currentDocs.length > 0 && currentDocs.every((d) => selectedDocs.has(d.filename));
  const someCurrentSelected =
    currentDocs.some((d) => selectedDocs.has(d.filename)) && !allCurrentSelected;

  const handleToggleSelectAll = () => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (allCurrentSelected) {
        currentDocs.forEach((d) => next.delete(d.filename));
      } else {
        currentDocs.forEach((d) => next.add(d.filename));
      }
      return next;
    });
  };

  const handleToggleSelectDoc = (filename: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return;
    setIsBulkDeleting(true);
    try {
      for (const filename of Array.from(selectedDocs)) {
        await deleteDoc.mutateAsync({ botId, filename });
      }
      setSelectedDocs(new Set());
      setShowBulkConfirm(false);
      if (inspectDoc && selectedDocs.has(inspectDoc.filename)) {
        setInspectDoc(null);
      }
    } catch { } finally {
      setIsBulkDeleting(false);
    }
  };

  // Single Delete
  const handleDeleteDoc = async (filename: string) => {
    try {
      await deleteDoc.mutateAsync({ botId, filename });
      setConfirmDeleteName(null);
      setSelectedDocs((prev) => {
        const next = new Set(prev);
        next.delete(filename);
        return next;
      });
      if (inspectDoc?.filename === filename) setInspectDoc(null);
    } catch { }
  };

  // File Upload
  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadMsg(null);
    for (const file of Array.from(files)) {
      if (file.size > MAX_MB * 1024 * 1024) {
        setUploadMsg({ ok: false, text: `"${file.name}" exceeds the ${MAX_MB}MB limit.` });
        continue;
      }
      try {
        const res = await uploadFile.mutateAsync({ botId, file });
        setUploadMsg({
          ok: true,
          text: `Added ${res.filename} (${res.chars.toLocaleString()} chars).`,
        });
      } catch (err: any) {
        setUploadMsg({
          ok: false,
          text: err instanceof AdminApiError ? err.message : `Failed to process "${file.name}".`,
        });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Web Crawl
  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlUrl.trim() || crawlLoading) return;
    setCrawlLoading(true);
    setCrawlMsg(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiUrl}/admin/crawl-sitemap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, url: crawlUrl.trim() }),
      });
      if (!res.ok) throw new Error("Crawl request failed.");
      setCrawlMsg({
        ok: true,
        text: `Crawling started for ${crawlUrl}. Sources will appear in your library.`,
      });
      setCrawlUrl("");
      setTimeout(() => refetchDocs(), 2500);
    } catch (err: any) {
      setCrawlMsg({ ok: false, text: err.message || "Could not crawl this URL." });
    } finally {
      setCrawlLoading(false);
    }
  };

  // Direct Text Ingestion
  const handleSaveText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || ingestDoc.isPending) return;
    const fname = rawTitle.trim()
      ? rawTitle.trim().endsWith(".txt")
        ? rawTitle.trim()
        : `${rawTitle.trim()}.txt`
      : `note_${Date.now()}.txt`;

    try {
      await ingestDoc.mutateAsync({ botId, filename: fname, text: rawText });
      setRawTitle("");
      setRawText("");
      setShowAddModal(false);
    } catch { }
  };

  // FAQ Ingestion
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim() || ingestDoc.isPending) return;
    const slug = faqQuestion
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 32);
    const fname = `faq_${slug || Date.now()}.txt`;
    const content = `Question: ${faqQuestion.trim()}\nAnswer: ${faqAnswer.trim()}`;

    try {
      await ingestDoc.mutateAsync({ botId, filename: fname, text: content });
      setFaqQuestion("");
      setFaqAnswer("");
      setShowAddModal(false);
    } catch { }
  };

  // 1-Click Answer Ingestion from Knowledge Gaps
  const handleAnswerInquiry = async (question: string) => {
    if (!inquiryAnswer.trim() || ingestDoc.isPending) return;
    const slug = question
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 32);
    const fname = `faq_${slug || Date.now()}.txt`;
    const content = `Question: ${question.trim()}\nAnswer: ${inquiryAnswer.trim()}`;

    try {
      await ingestDoc.mutateAsync({ botId, filename: fname, text: content });
      setAnsweredMap((prev) => ({ ...prev, [question]: true }));
      setActiveQuestion(null);
      setInquiryAnswer("");
    } catch { }
  };

  const handleDismissQuestion = (question: string) => {
    setDismissedMap((prev) => ({ ...prev, [question]: true }));
    if (activeQuestion === question) {
      setActiveQuestion(null);
      setInquiryAnswer("");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Cohesive, Premium Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-[800] tracking-tight text-fg">Knowledge Base</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-[650] text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Embeddings Synced
            </span>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            The grounded intelligence library powering your agent. Add content, crawl URLs, and resolve customer questions.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2.5">
          {onNavigateToPlayground && (
            <button
              type="button"
              onClick={onNavigateToPlayground}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-[12.5px] font-[650] text-fg hover:border-accent hover:text-accent transition-all cursor-pointer shadow-2xs"
            >
              <span>Test in Sandbox</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[12.5px] font-[700] text-white hover:bg-accent-strong shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Knowledge</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Workspace Canvas */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {/* Workspace Nav Header */}
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-panel/30">
          {/* Segmented View Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-panel border border-border/70">
            <button
              type="button"
              onClick={() => setActiveTab("sources")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[12.5px] font-[650] transition-all cursor-pointer",
                activeTab === "sources"
                  ? "bg-surface text-fg shadow-2xs font-[750]"
                  : "text-muted hover:text-fg"
              )}
            >
              <Database className="h-3.5 w-3.5 text-accent" />
              <span>Grounded Sources</span>
              <span className="rounded-full bg-panel px-2 py-0.2 text-[11px] font-[700] border border-border/60">
                {docs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("gaps")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[12.5px] font-[650] transition-all cursor-pointer",
                activeTab === "gaps"
                  ? "bg-surface text-fg shadow-2xs font-[750]"
                  : "text-muted hover:text-fg"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Unanswered Gaps</span>
              {totalUnaddressedCount > 0 ? (
                <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.2 text-[11px] font-[700] border border-amber-500/20">
                  {totalUnaddressedCount}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.2 text-[11px] font-[700]">
                  0
                </span>
              )}
            </button>
          </div>

          {/* Quick inline stats summary */}
          <div className="hidden md:flex items-center gap-3 text-[12px] text-muted">
            <span>
              <strong className="text-fg font-[700]">{totalChars.toLocaleString()}</strong> characters grounded
            </span>
            <span>&middot;</span>
            <span>
              <strong className="text-fg font-[700]">{docs.length}</strong> active nodes
            </span>
          </div>
        </div>

        {/* ----------------- TAB 1: GROUNDED SOURCES ----------------- */}
        {activeTab === "sources" && (
          <div>
            {/* Quick Unanswered Alert Banner if Gaps exist */}
            {totalUnaddressedCount > 0 && (
              <div className="bg-amber-500/8 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3 text-[12.5px]">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-[550]">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>
                    Visitors asked <strong>{totalUnaddressedCount} questions</strong> recently that your docs couldn&apos;t answer.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("gaps")}
                  className="text-[12px] font-[700] text-accent hover:underline cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <span>Review & Answer Gaps</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Table Filter & Search Toolbar */}
            <div className="p-3.5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface">
              {/* Left: Filter Pills */}
              <div className="flex items-center gap-1 flex-wrap">
                <div className="flex rounded-xl border border-border bg-panel/50 p-0.5 text-[11.5px] font-[600]">
                  <button
                    type="button"
                    onClick={() => setTypeFilter("all")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                      typeFilter === "all"
                        ? "bg-surface text-fg shadow-2xs font-[700]"
                        : "text-muted hover:text-fg"
                    )}
                  >
                    All ({docs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("web")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                      typeFilter === "web"
                        ? "bg-surface text-fg shadow-2xs font-[700]"
                        : "text-muted hover:text-fg"
                    )}
                  >
                    Web Pages ({counts.web})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("file")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                      typeFilter === "file"
                        ? "bg-surface text-fg shadow-2xs font-[700]"
                        : "text-muted hover:text-fg"
                    )}
                  >
                    Files ({counts.file})
                  </button>
                  {counts.faq > 0 && (
                    <button
                      type="button"
                      onClick={() => setTypeFilter("faq")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                        typeFilter === "faq"
                          ? "bg-surface text-fg shadow-2xs font-[700]"
                          : "text-muted hover:text-fg"
                      )}
                    >
                      FAQs ({counts.faq})
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Search & Sorting */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sources…"
                    className="w-44 sm:w-56 rounded-xl border border-border bg-panel/30 pl-8 pr-7 py-1.5 text-[12px] text-fg placeholder:text-muted outline-none focus:border-accent focus:bg-surface transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-2 text-muted hover:text-fg cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <select
                    value={docSort}
                    onChange={(e) => setDocSort(e.target.value as DocSort)}
                    className="rounded-xl border border-border bg-panel/30 px-2.5 py-1.5 text-[11.5px] font-[600] text-muted outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="chars">Sort: Volume</option>
                    <option value="size">Sort: File Size</option>
                    <option value="name">Sort: Title (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bulk Action Strip */}
            {selectedDocs.size > 0 && (
              <div className="bg-accent/10 border-b border-accent/20 px-4 py-2 flex items-center justify-between text-[12px] animate-in fade-in duration-150">
                <span className="font-[650] text-accent flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{selectedDocs.size} source{selectedDocs.size === 1 ? "" : "s"} selected</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDocs(new Set())}
                    className="text-[11.5px] font-[600] text-muted hover:text-fg px-2 py-0.5 rounded cursor-pointer"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkConfirm(true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-500 text-white px-2.5 py-1 text-[11.5px] font-[650] shadow-2xs hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete Selected</span>
                  </button>
                </div>
              </div>
            )}

            {/* Premium Table Content */}
            {docsLoading ? (
              <div className="p-12 text-center text-[12.5px] text-muted">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-accent" />
                Loading grounded intelligence sources…
              </div>
            ) : currentDocs.length === 0 ? (
              <div className="p-16 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-panel border border-border/80 text-muted mx-auto mb-3">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="text-[14px] font-[750] text-fg">No knowledge sources found</h3>
                <p className="text-[12px] text-muted mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? "Try adjusting your search keywords or clearing filters."
                    : "Add website URLs, PDFs, or verified FAQs to ground your agent's responses."}
                </p>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[12.5px] font-[700] text-white hover:bg-accent-strong cursor-pointer shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add First Source</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 bg-panel/20 text-[11.5px] font-[700] text-muted uppercase tracking-wider">
                      <th className="py-3 px-4 w-10">
                        <button
                          type="button"
                          onClick={handleToggleSelectAll}
                          className="text-muted hover:text-fg rounded cursor-pointer"
                        >
                          {allCurrentSelected ? (
                            <CheckSquare className="h-4 w-4 text-accent" />
                          ) : someCurrentSelected ? (
                            <MinusSquare className="h-4 w-4 text-accent" />
                          ) : (
                            <Square className="h-4 w-4 text-muted/50" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-4">Knowledge Source</th>
                      <th className="py-3 px-4">Channel</th>
                      <th className="py-3 px-4">Volume</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-[12.5px]">
                    {currentDocs.map((doc) => {
                      const meta = formatDocDisplay(doc.filename);
                      const isSelected = selectedDocs.has(doc.filename);
                      return (
                        <tr
                          key={doc.filename}
                          className={cn(
                            "group hover:bg-panel/40 transition-colors",
                            isSelected && "bg-accent/[0.03]"
                          )}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectDoc(doc.filename)}
                              className="text-muted hover:text-fg rounded cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-accent" />
                              ) : (
                                <Square className="h-4 w-4 text-muted/40" />
                              )}
                            </button>
                          </td>

                          {/* Source Title & Details */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
                                  meta.type === "web" && "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                                  meta.type === "file" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                  meta.type === "faq" && "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                )}
                              >
                                {meta.type === "web" && <Globe className="h-4 w-4" />}
                                {meta.type === "file" && <FileText className="h-4 w-4" />}
                                {meta.type === "faq" && <HelpCircle className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0">
                                <div className="font-[700] text-fg truncate max-w-sm">
                                  {meta.title}
                                </div>
                                <div className="text-[11px] text-muted truncate font-mono">
                                  {doc.filename}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Channel Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-[650] border",
                                meta.type === "web" &&
                                  "bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-300",
                                meta.type === "file" &&
                                  "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300",
                                meta.type === "faq" &&
                                  "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300"
                              )}
                            >
                              {meta.type === "web"
                                ? "Web Crawler"
                                : meta.type === "faq"
                                ? "Verified Q&A"
                                : "File Parser"}
                            </span>
                          </td>

                          {/* Volume */}
                          <td className="py-3 px-4">
                            <div className="font-[600] text-fg">
                              {doc.chars.toLocaleString()}{" "}
                              <span className="text-[11px] font-normal text-muted">chars</span>
                            </div>
                            <div className="text-[11px] text-muted">
                              {(doc.size / 1024).toFixed(1)} KB
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-[650] text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectDoc(doc)}
                                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11.5px] font-[650] text-fg hover:border-accent hover:text-accent transition-all cursor-pointer shadow-2xs"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Inspect</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setConfirmDeleteName(doc.filename)}
                                className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer"
                                title="Delete source"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalDocPages > 1 && (
              <div className="p-3.5 border-t border-border/60 bg-panel/20 flex items-center justify-between text-[12px] text-muted">
                <span>
                  Showing {(docPage - 1) * DOCS_PER_PAGE + 1}–
                  {Math.min(docPage * DOCS_PER_PAGE, sortedDocs.length)} of {sortedDocs.length} sources
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDocPage((p) => Math.max(1, p - 1))}
                    disabled={docPage <= 1}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-surface disabled:opacity-40 hover:bg-panel transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  {Array.from({ length: totalDocPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDocPage(p)}
                      className={cn(
                        "h-7 min-w-7 px-1.5 rounded-lg text-[11.5px] font-[650] transition-all cursor-pointer",
                        docPage === p
                          ? "bg-accent text-white shadow-2xs"
                          : "border border-border bg-surface text-muted hover:text-fg"
                      )}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setDocPage((p) => Math.min(totalDocPages, p + 1))}
                    disabled={docPage >= totalDocPages}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-surface disabled:opacity-40 hover:bg-panel transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 2: UNANSWERED INQUIRIES (TRIAGE) ----------------- */}
        {activeTab === "gaps" && (
          <div className="p-5 space-y-5">
            {/* Triage Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-[750] text-fg">Knowledge Gap Triage</h2>
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-[700] text-amber-600 dark:text-amber-400">
                    {unaddressedQuestions.length} to resolve
                  </span>
                </div>
                <p className="text-[12.5px] text-muted mt-0.5">
                  Questions visitors asked in live chat that weren&apos;t covered by your docs. Answering them grounds your AI in 1 click.
                </p>
              </div>

              {/* Search bar if many questions */}
              {(stats?.topQuestions ?? []).length > 3 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    placeholder="Search gap questions…"
                    className="w-56 rounded-xl border border-border bg-panel/40 pl-8 pr-3 py-1.5 text-[12px] text-fg placeholder:text-muted outline-none focus:border-accent"
                  />
                </div>
              )}
            </div>

            {/* Questions List */}
            {unaddressedQuestions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mx-auto mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-[14px] font-[750] text-fg">Zero Knowledge Gaps!</h3>
                <p className="text-[12px] text-muted mt-1 max-w-sm mx-auto">
                  {questionSearch
                    ? "No unanswered inquiries match your search filter."
                    : "Your agent has successfully answered all visitor questions using your grounded sources."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentQuestions.map((q) => {
                  const isAnswering = activeQuestion === q.question;
                  return (
                    <div
                      key={q.question}
                      className={cn(
                        "rounded-xl border border-border/70 bg-panel/30 p-4 transition-all",
                        isAnswering && "border-accent/40 bg-surface shadow-xs"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10.5px] font-mono font-[700] text-accent">
                              Asked ×{q.count}
                            </span>
                            <span className="text-[11.5px] text-muted">Visitor inquiry</span>
                          </div>
                          <p className="text-[14px] font-[700] text-fg mt-1 leading-snug">
                            &ldquo;{q.question}&rdquo;
                          </p>
                        </div>

                        {/* Top Right Quick Actions */}
                        {!isAnswering && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDismissQuestion(q.question)}
                              className="rounded-lg px-2.5 py-1 text-[11.5px] font-[600] text-muted hover:text-rose-500 transition-colors cursor-pointer"
                              title="Dismiss irrelevant question"
                            >
                              Dismiss
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveQuestion(q.question);
                                setInquiryAnswer("");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-[700] text-white hover:bg-accent-strong transition-all cursor-pointer shadow-2xs"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Answer & Train</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Smooth inline answer composer */}
                      {isAnswering && (
                        <div className="mt-3.5 pt-3 border-t border-border/60 space-y-2.5 animate-in fade-in duration-150">
                          <label className="block text-[12px] font-[650] text-fg">
                            Verified answer for your agent:
                          </label>
                          <textarea
                            rows={3}
                            value={inquiryAnswer}
                            onChange={(e) => setInquiryAnswer(e.target.value)}
                            placeholder="Type the exact, verified answer your agent should provide when visitors ask this…"
                            className="w-full rounded-xl border border-border bg-panel/30 p-3 text-[12.5px] text-fg outline-none focus:border-accent focus:bg-surface leading-relaxed"
                            autoFocus
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted">
                              Will be indexed as a permanent Q&A override in ChromaDB.
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveQuestion(null);
                                  setInquiryAnswer("");
                                }}
                                className="rounded-lg px-3 py-1.5 text-[12px] font-[600] text-muted hover:text-fg transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAnswerInquiry(q.question)}
                                disabled={!inquiryAnswer.trim() || ingestDoc.isPending}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-[12px] font-[700] text-white hover:bg-accent-strong disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                              >
                                {ingestDoc.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                <span>Train Agent Memory</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Triage Pagination */}
                {totalQuestionPages > 1 && (
                  <div className="pt-3 flex items-center justify-between text-[12px] text-muted border-t border-border/60">
                    <span>
                      Page {questionPage} of {totalQuestionPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQuestionPage((p) => Math.max(1, p - 1))}
                        disabled={questionPage <= 1}
                        className="px-2.5 py-1 rounded-lg border border-border bg-surface disabled:opacity-40 hover:bg-panel cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestionPage((p) => Math.min(totalQuestionPages, p + 1))}
                        disabled={questionPage >= totalQuestionPages}
                        className="px-2.5 py-1 rounded-lg border border-border bg-surface disabled:opacity-40 hover:bg-panel cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Add Knowledge Modal (Clean Multi-Channel Ingestion) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-border/60 flex items-center justify-between bg-panel/30">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-accent" />
                <h3 className="text-[15px] font-[750] text-fg">Add Knowledge Source</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-panel hover:text-fg transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Channel Selector */}
            <div className="p-3 border-b border-border/60 bg-surface">
              <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-panel border border-border/70 text-[11.5px] font-[650]">
                <button
                  type="button"
                  onClick={() => setIngestTab("files")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer",
                    ingestTab === "files"
                      ? "bg-surface text-fg shadow-2xs font-[700]"
                      : "text-muted hover:text-fg"
                  )}
                >
                  <Upload className="h-3 w-3" />
                  <span>Files</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIngestTab("web")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer",
                    ingestTab === "web"
                      ? "bg-surface text-fg shadow-2xs font-[700]"
                      : "text-muted hover:text-fg"
                  )}
                >
                  <Globe className="h-3 w-3" />
                  <span>Website</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIngestTab("faq")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer",
                    ingestTab === "faq"
                      ? "bg-surface text-fg shadow-2xs font-[700]"
                      : "text-muted hover:text-fg"
                  )}
                >
                  <HelpCircle className="h-3 w-3" />
                  <span>Q&A</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIngestTab("text")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer",
                    ingestTab === "text"
                      ? "bg-surface text-fg shadow-2xs font-[700]"
                      : "text-muted hover:text-fg"
                  )}
                >
                  <FileCode className="h-3 w-3" />
                  <span>Text</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              {/* Channel 1: Upload Files */}
              {ingestTab === "files" && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT}
                    multiple
                    className="hidden"
                    onChange={(e) => handleUploadFiles(e.target.files)}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      handleUploadFiles(e.dataTransfer.files);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
                      dragging
                        ? "border-accent bg-accent/5 scale-[0.99]"
                        : "border-border/80 bg-panel/30 hover:border-accent/60 hover:bg-panel/50"
                    )}
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
                      <CloudUpload className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[13.5px] font-[700] text-fg block">
                        Click to upload or drag files here
                      </span>
                      <span className="text-[12px] text-muted block mt-1">
                        PDF, Word (.docx), TXT, Markdown, CSV, or images (up to {MAX_MB}MB)
                      </span>
                    </div>
                  </div>

                  {uploadFile.isPending && (
                    <div className="flex items-center gap-2 rounded-xl bg-panel p-3 text-[12px] text-muted">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      <span>Parsing text and generating vector embeddings…</span>
                    </div>
                  )}

                  {uploadMsg && (
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-xl p-3 text-[12px]",
                        uploadMsg.ok
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {uploadMsg.ok ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span>{uploadMsg.text}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Channel 2: Crawl Website */}
              {ingestTab === "web" && (
                <form onSubmit={handleCrawl} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-[650] text-fg mb-1">
                      Website URL or Sitemap
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted pointer-events-none" />
                      <input
                        type="url"
                        value={crawlUrl}
                        onChange={(e) => setCrawlUrl(e.target.value)}
                        placeholder="https://yourcompany.com/docs or sitemap.xml"
                        className="w-full rounded-xl border border-border bg-panel/30 pl-9 pr-3 py-2 text-[12.5px] text-fg outline-none focus:border-accent focus:bg-surface transition-all"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11.5px] text-muted mt-1.5">
                      Our autonomous crawler traverses internal links, extracts clean text, and syncs chunks to ChromaDB.
                    </p>
                  </div>

                  {crawlMsg && (
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-xl p-3 text-[12px]",
                        crawlMsg.ok
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {crawlMsg.ok ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span>{crawlMsg.text}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={!crawlUrl.trim() || crawlLoading}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[12.5px] font-[700] text-white hover:bg-accent-strong disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {crawlLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      <span>Start Crawl</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Channel 3: Q&A Overrides */}
              {ingestTab === "faq" && (
                <form onSubmit={handleSaveFaq} className="space-y-3">
                  <div>
                    <label className="block text-[12px] font-[650] text-fg mb-1">
                      Visitor Question
                    </label>
                    <input
                      type="text"
                      value={faqQuestion}
                      onChange={(e) => setFaqQuestion(e.target.value)}
                      placeholder="e.g. What is your return policy?"
                      className="w-full rounded-xl border border-border bg-panel/30 px-3 py-2 text-[12.5px] text-fg outline-none focus:border-accent focus:bg-surface"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-[650] text-fg mb-1">
                      Verified Answer
                    </label>
                    <textarea
                      rows={3}
                      value={faqAnswer}
                      onChange={(e) => setFaqAnswer(e.target.value)}
                      placeholder="Provide the exact instructions or answer your agent should provide…"
                      className="w-full rounded-xl border border-border bg-panel/30 px-3 py-2 text-[12.5px] text-fg outline-none focus:border-accent focus:bg-surface resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={!faqQuestion.trim() || !faqAnswer.trim() || ingestDoc.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[12.5px] font-[700] text-white hover:bg-accent-strong disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {ingestDoc.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      <span>Save Verified Q&A</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Channel 4: Raw Text */}
              {ingestTab === "text" && (
                <form onSubmit={handleSaveText} className="space-y-3">
                  <div>
                    <label className="block text-[12px] font-[650] text-fg mb-1">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={rawTitle}
                      onChange={(e) => setRawTitle(e.target.value)}
                      placeholder="e.g. pricing_notes.txt"
                      className="w-full rounded-xl border border-border bg-panel/30 px-3 py-2 text-[12.5px] text-fg outline-none focus:border-accent focus:bg-surface"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-[650] text-fg mb-1">
                      Content Body
                    </label>
                    <textarea
                      rows={4}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Paste raw business information, hours, pricing sheets, or internal documentation…"
                      className="w-full rounded-xl border border-border bg-panel/30 px-3 py-2 text-[12.5px] text-fg outline-none focus:border-accent focus:bg-surface font-mono"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={!rawText.trim() || ingestDoc.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[12.5px] font-[700] text-white hover:bg-accent-strong disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {ingestDoc.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      <span>Save & Embed</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Slide-Over Document Inspector Drawer */}
      {inspectDoc && (
        <DocInspectorDrawer
          botId={botId}
          doc={inspectDoc}
          onClose={() => setInspectDoc(null)}
          onDelete={(fname) => setConfirmDeleteName(fname)}
        />
      )}

      {/* 5. Single Delete Confirmation */}
      {confirmDeleteName && (
        <ConfirmDialog
          title={`Delete "${confirmDeleteName}"?`}
          body="The AI memory and vector embeddings for this source will be permanently removed."
          confirmLabel="Delete source"
          busy={deleteDoc.isPending}
          onCancel={() => setConfirmDeleteName(null)}
          onConfirm={() => handleDeleteDoc(confirmDeleteName)}
        />
      )}

      {/* 6. Bulk Delete Confirmation */}
      {showBulkConfirm && (
        <ConfirmDialog
          title={`Delete ${selectedDocs.size} selected sources?`}
          body="All vector embeddings and grounded chunks for these files will be permanently removed from your agent's memory."
          confirmLabel={`Delete ${selectedDocs.size} sources`}
          busy={isBulkDeleting}
          onCancel={() => setShowBulkConfirm(false)}
          onConfirm={handleBulkDelete}
        />
      )}
    </div>
  );
}

// Slide-Over Document Inspector Drawer
function DocInspectorDrawer({
  botId,
  doc,
  onClose,
  onDelete,
}: {
  botId: string;
  doc: AdminDoc;
  onClose: () => void;
  onDelete: (filename: string) => void;
}) {
  const { data: content, isLoading, isError } = useDocContent(botId, doc.filename);
  const [copied, setCopied] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const meta = formatDocDisplay(doc.filename);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = (content || "").split("\n");
  const filteredLines = docSearch.trim()
    ? lines.filter((l) => l.toLowerCase().includes(docSearch.toLowerCase()))
    : lines;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl h-full bg-surface border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 bg-panel/30">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent shrink-0" />
              <h2 className="text-[14px] font-[750] text-fg truncate">{meta.title}</h2>
            </div>
            <p className="text-[11.5px] text-muted mt-0.5">
              {doc.filename} &middot; {(doc.size / 1024).toFixed(1)} KB &middot; {doc.chars.toLocaleString()} characters
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!content}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11.5px] font-[600] text-fg hover:border-accent transition-all cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-panel hover:text-fg transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* In-doc search */}
        <div className="p-3 border-b border-border/60 bg-surface">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
            <input
              type="text"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Search inside document text…"
              className="w-full rounded-xl border border-border bg-panel/30 pl-8 pr-3 py-1.5 text-[12px] text-fg placeholder:text-muted outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed text-fg/90 select-text">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted">
              <Loader2 className="h-5 w-5 animate-spin mb-2 text-accent" />
              <span>Fetching grounded document chunks…</span>
            </div>
          ) : isError ? (
            <div className="rounded-xl bg-rose-500/10 p-4 text-[12.5px] text-rose-600 dark:text-rose-400">
              Could not retrieve raw document text from storage.
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words bg-panel/20 p-4 rounded-xl border border-border/50">
              {filteredLines.join("\n") || "No matching text found."}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border flex items-center justify-between bg-panel/30">
          <span className="text-[11px] text-muted">
            Cosine similarity vector chunks indexed in ChromaDB.
          </span>
          <button
            type="button"
            onClick={() => onDelete(doc.filename)}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11.5px] font-[600] text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Delete Source</span>
          </button>
        </div>
      </div>
    </div>
  );
}
