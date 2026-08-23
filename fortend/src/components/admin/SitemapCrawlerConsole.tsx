"use client";

import React, { useState, useEffect } from "react";
import { Globe, Search, CheckCircle, Clock, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { markSetupDone } from "@/lib/setupProgress";

interface PageInfo {
  url: string;
  status: "in_progress" | "done" | "failed";
  chars: number;
  title: string;
}

interface CrawlJob {
  status: "idle" | "starting" | "discovering" | "scraping" | "completed" | "failed";
  total_urls: number;
  scraped_urls: number;
  total_chars: number;
  current_url: string;
  discovered_pages: PageInfo[];
}

interface SitemapCrawlerConsoleProps {
  botId: string;
  onCrawlComplete?: () => void;
}

export function SitemapCrawlerConsole({ botId, onCrawlComplete }: SitemapCrawlerConsoleProps) {
  const [url, setUrl] = useState("");
  const [job, setJob] = useState<CrawlJob>({
    status: "idle",
    total_urls: 0,
    scraped_urls: 0,
    total_chars: 0,
    current_url: "",
    discovered_pages: [],
  });
  const [error, setError] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/crawl-status?botId=${encodeURIComponent(botId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.job && data.job.status !== "idle") {
          setJob(data.job);
          if (data.job.status === "completed" && onCrawlComplete) {
            onCrawlComplete();
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch crawl status", err);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (["starting", "discovering", "scraping"].includes(job.status)) {
      timer = setInterval(fetchStatus, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [job.status, botId]);

  const handleStartCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) {
      setError("Please enter a valid website domain or URL.");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/admin/crawl-sitemap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, url: url.trim() }),
      });
      if (!res.ok) {
        throw new Error("We couldn't start the scan — try again.");
      }
      const data = await res.json();
      if (data.job) {
        setJob(data.job);
        markSetupDone(botId, "knowledge");
      }
    } catch (err: any) {
      setError(err.message || "We couldn't start the scan — try again.");
    }
  };

  const progressPct = job.total_urls > 0 ? Math.round((job.scraped_urls / job.total_urls) * 100) : 0;

  return (
    <div className="rounded-r2 border border-border bg-panel p-5 mt-6 shadow-xs">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="grid h-8 w-8 place-items-center rounded-r1 bg-indigo-500/15 text-indigo-600">
          <Globe className="h-4.5 w-4.5" />
        </span>
        <div>
          <b className="block text-[14px] font-[750] text-fg">Import from your website</b>
          <p className="text-[12px] text-muted">
            We&apos;ll find and import up to 50 pages from your site automatically.
          </p>
        </div>
      </div>

      <form onSubmit={handleStartCrawl} className="mt-4 flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. https://acme-services.com"
            disabled={["starting", "discovering", "scraping"].includes(job.status)}
            className="w-full rounded-r1 border border-border bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-faint focus:outline-none focus:border-accent disabled:opacity-60 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={["starting", "discovering", "scraping"].includes(job.status) || !url.trim()}
          className="flex items-center justify-center gap-1.5 rounded-r1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-[700] px-4 py-2 text-[13px] transition-colors whitespace-nowrap"
        >
          {["starting", "discovering", "scraping"].includes(job.status) ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Scanning your site…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Scan my website
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-2 text-[12.5px] font-[600] text-bad flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Visual Crawler Progress Dashboard */}
      {job.status !== "idle" && (
        <div className="mt-5 border-t border-border pt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-surface p-3.5 rounded-r1 border border-border">
            <div>
              <span className="text-[11.5px] font-[700] text-faint uppercase tracking-wider block">Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {job.status === "discovering" && (
                  <span className="text-amber-600 font-[700] text-[13.5px] flex items-center gap-1.5 animate-pulse">
                    <Layers className="h-4 w-4" /> Finding your pages…
                  </span>
                )}
                {job.status === "scraping" && (
                  <span className="text-indigo-600 font-[700] text-[13.5px] flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Importing pages ({job.scraped_urls} / {job.total_urls})
                  </span>
                )}
                {job.status === "completed" && (
                  <span className="text-emerald-600 font-[700] text-[13.5px] flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Done — your content is ready to use.
                  </span>
                )}
                {job.status === "failed" && (
                  <span className="text-bad font-[700] text-[13.5px]">We couldn&apos;t finish — check the URL and try again.</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 text-right">
              <div>
                <span className="text-[11px] font-[600] text-muted block">Characters imported</span>
                <span className="text-[15px] font-[750] font-mono text-fg">{job.total_chars.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[11px] font-[600] text-muted block">Pages found</span>
                <span className="text-[15px] font-[750] font-mono text-indigo-600">{job.discovered_pages.length}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {job.total_urls > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11.5px] font-[650] text-muted">
                <span className="truncate max-w-[70%]">
                  {job.current_url ? `Importing: ${job.current_url}` : "All pages imported."}
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full bg-ring h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Sub-pages interactive list */}
          {job.discovered_pages.length > 0 && (
            <div className="max-h-[220px] overflow-y-auto rounded-r1 border border-border bg-surface/80 divide-y divide-border">
              {job.discovered_pages.map((p, idx) => (
                <div key={idx} className="px-3 py-2 flex items-center justify-between text-[12px] hover:bg-panel transition-colors">
                  <div className="min-w-0 flex items-center gap-2">
                    {p.status === "in_progress" ? (
                      <Clock className="h-3.5 w-3.5 text-amber-500 animate-spin shrink-0" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span className="font-[650] text-fg truncate">{p.title}</span>
                    <span className="text-faint font-mono text-[11px] truncate max-w-[200px] hidden sm:inline">({p.url})</span>
                  </div>
                  <span className="text-[11.5px] font-mono text-muted shrink-0 pl-2">
                    {p.chars > 0 ? `${p.chars.toLocaleString()} chars` : "In queue..."}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
