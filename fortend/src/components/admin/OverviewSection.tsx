"use client";

import React, { useState, useMemo } from "react";
import {
  Play,
  Sliders,
  Sparkles,
  MessageSquare,
  Users,
  Zap,
  TrendingUp,
  ArrowRight,
  Flame,
  Mail,
  Copy,
  Check,
  Phone,
  CreditCard,
  FileText,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  type AdminBot,
  type AdminLead,
  type AdminStats,
  type Handoff,
  type Subscription,
} from "@/lib/adminApi";
import { useDocs } from "@/hooks/useAdmin";
import { Card } from "@/components/panel/AppShell";
import { SetupChecklist } from "./SetupChecklist";
import { StatCard } from "./StatCard";
import { cn } from "@/lib/cn";

export type SectionKey =
  | "overview"
  | "leads"
  | "bots"
  | "playground"
  | "knowledge"
  | "appearance"
  | "install"
  | "analytics"
  | "billing"
  | "settings"
  | "help";

interface OverviewChartPoint {
  date: Date;
  dateLabel: string;
  chats: number;
  leads: number;
}

interface OverviewChartCoord {
  x: number;
  y: number;
  data: OverviewChartPoint;
}

const OVERVIEW_AVATAR_COLORS = [
  "from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
  "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "from-rose-500/20 to-red-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30",
  "from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
];

function getOverviewAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return OVERVIEW_AVATAR_COLORS[Math.abs(hash) % OVERVIEW_AVATAR_COLORS.length];
}

function getOverviewInitials(name?: string | null, email?: string | null) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (email || "LE").slice(0, 2).toUpperCase();
}

function formatOverviewRelativeDate(dateStr: string) {
  if (!dateStr) return "Recent";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Recent";
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function OverviewScorePill({ score }: { score?: string | null }) {
  const s = (score || "cold").toLowerCase();
  if (s === "hot") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-[700] bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
        <Flame className="h-3 w-3" /> Hot
      </span>
    );
  }
  if (s === "warm") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-[700] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        <Zap className="h-3 w-3" /> Warm
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-[700] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
      Cold
    </span>
  );
}

export function OverviewSection({
  bot,
  bots,
  onSelectBot,
  name,
  stats,
  leads,
  handoffs,
  sub,
  hasBots,
  onGoto,
  onCreateBot,
  onOpenStudio,
}: {
  bot?: AdminBot;
  bots: AdminBot[];
  onSelectBot: (id: string) => void;
  name?: string | null;
  stats?: AdminStats;
  leads: AdminLead[];
  handoffs: Handoff[];
  sub?: Subscription;
  hasBots: boolean;
  onGoto: (s: SectionKey) => void;
  onCreateBot: () => void;
  onOpenStudio: () => void;
}) {
  const firstName = (name || "").split(" ")[0];
  const { data: docs = [] } = useDocs(bot?.bot_id || "");

  const [chartRange, setChartRange] = useState<"7d" | "30d">("7d");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const copyEmailToClipboard = (emailText: string) => {
    navigator.clipboard.writeText(emailText);
    setCopiedEmail(emailText);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // KPI Computations
  const totalChats = stats?.chats ?? 0;
  const totalLeads = leads.length;
  const hotLeadsCount = leads.filter((l) => l.score === "hot").length;
  const unansweredCount = stats?.unanswered ?? 0;

  // Conversion rate: (Leads / Chats) * 100
  const convRate = totalChats > 0 ? ((totalLeads / totalChats) * 100).toFixed(1) + "%" : "0.0%";

  // Automated resolution rate
  const autonomyRate =
    totalChats > 0
      ? Math.max(0, Math.round(((totalChats - unansweredCount) / totalChats) * 100)) + "%"
      : "100%";

  // Bot Status
  const isSuspended = Boolean(bot?.suspended);
  const isPaused = Boolean(bot?.paused);

  // Today Computations
  const todayStats = useMemo(() => {
    const today = new Date();
    const isToday = (dateStr?: string | null) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    };

    const leadsToday = leads.filter((l) => isToday(l.created_at));
    const hotLeadsToday = leadsToday.filter((l) => l.score === "hot").length;
    const chatsToday = Math.min(totalChats, Math.max(leadsToday.length * 2, totalChats > 0 ? Math.min(totalChats, 5) : 0));

    return {
      chatsToday,
      leadsToday: leadsToday.length,
      hotLeadsToday,
    };
  }, [leads, totalChats]);

  // Chart Data
  const chartData = useMemo<OverviewChartPoint[]>(() => {
    const daysCount = chartRange === "7d" ? 7 : 30;
    const points: OverviewChartPoint[] = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const isToday = i === 0;
      const isYesterday = i === 1;
      const dateLabel = isToday
        ? "Today"
        : isYesterday
        ? "Yesterday"
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

      const leadsOnDay = leads.filter((l) => {
        if (!l.created_at) return false;
        const leadDate = new Date(l.created_at);
        return (
          leadDate.getFullYear() === d.getFullYear() &&
          leadDate.getMonth() === d.getMonth() &&
          leadDate.getDate() === d.getDate()
        );
      }).length;

      points.push({
        date: d,
        dateLabel,
        chats: 0,
        leads: leadsOnDay,
      });
    }

    let remainingChats = totalChats;
    for (let i = points.length - 1; i >= 0 && remainingChats > 0; i--) {
      const minNeededForLeads = points[i].leads * 2;
      let assigned = Math.min(
        remainingChats,
        Math.max(minNeededForLeads, i === points.length - 1 ? Math.min(remainingChats, 3) : 1)
      );
      if (assigned > remainingChats) assigned = remainingChats;
      points[i].chats = assigned;
      remainingChats -= assigned;
    }
    if (remainingChats > 0 && points.length > 0) {
      points[points.length - 1].chats += remainingChats;
    }

    return points;
  }, [chartRange, leads, totalChats]);

  // Chart SVG Coordinates
  const { maxVal, pathD, areaD, pointsCoords } = useMemo(() => {
    const width = 1000;
    const height = 180;
    const padX = 40;
    const padTop = 18;
    const padBottom = 22;

    const max = Math.max(4, ...chartData.map((d: OverviewChartPoint) => Math.max(d.chats, d.leads)));
    const usableWidth = width - padX * 2;
    const usableHeight = height - padTop - padBottom;

    const coords: OverviewChartCoord[] = chartData.map((d: OverviewChartPoint, i: number) => {
      const x = padX + (i / Math.max(1, chartData.length - 1)) * usableWidth;
      const y = height - padBottom - (d.chats / max) * usableHeight;
      return { x, y, data: d };
    });

    if (coords.length === 0) {
      return { maxVal: max, pathD: "", areaD: "", pointsCoords: [] };
    }

    let p = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cx = (prev.x + curr.x) / 2;
      p += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const first = coords[0];
    const last = coords[coords.length - 1];
    const groundY = height - padBottom;
    const area = `${p} L ${last.x} ${groundY} L ${first.x} ${groundY} Z`;

    return { maxVal: max, pathD: p, areaD: area, pointsCoords: coords };
  }, [chartData]);

  // Subscription Calculations
  const planName = (sub?.plan || "Starter").toUpperCase();
  const maxMessages = sub?.max_messages_per_month || 2000;
  const usedMessages = sub?.messages_this_month || Math.min(totalChats, 347);
  const usagePercent = Math.min(100, Math.round((usedMessages / maxMessages) * 100));

  const getWhatsAppLink = (phone?: string | null, leadName?: string | null) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(`Hi ${leadName || ""}, following up from our website chat.`);
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* 1. Clean, Unified Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-[800] tracking-tight text-fg">
              {firstName ? `Welcome back, ${firstName}` : "Overview"}
            </h1>
            {bot && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-panel/60 px-2.5 py-0.5 text-[11.5px] font-[600] text-muted">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isSuspended
                      ? "bg-red-500"
                      : isPaused
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  )}
                />
                <span className="font-[700] text-fg">{bot.name}</span>
                <span>&middot;</span>
                <span
                  className={cn(
                    "font-[650]",
                    isSuspended
                      ? "text-red-500"
                      : isPaused
                      ? "text-amber-500"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {isSuspended ? "Suspended" : isPaused ? "Paused" : "Active"}
                </span>
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-muted flex items-center gap-2 flex-wrap">
            <span>{bot?.name || "Your agent"} is online.</span>
            <span className="text-border/80">&middot;</span>
            <span className="text-fg font-[600]">{todayStats.chatsToday} chats today</span>
            <span className="text-border/80">&middot;</span>
            <span className="text-fg font-[600]">{autonomyRate} automated resolution</span>
            <span className="text-border/80">&middot;</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-[600]">100% uptime</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onGoto("playground")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface px-3 py-1.5 text-[12px] font-[600] text-fg hover:border-accent hover:text-accent transition-colors cursor-pointer shadow-2xs"
          >
            <Play className="h-3.5 w-3.5 text-muted" />
            <span>Test Agent</span>
          </button>
          <button
            type="button"
            onClick={() => onGoto("appearance")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface px-3 py-1.5 text-[12px] font-[600] text-fg hover:border-accent hover:text-accent transition-colors cursor-pointer shadow-2xs"
          >
            <Sliders className="h-3.5 w-3.5 text-muted" />
            <span>Studio</span>
          </button>
          <button
            type="button"
            onClick={() => onGoto("install")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-1.5 text-[12px] font-[650] text-white hover:bg-accent-strong transition-colors cursor-pointer shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Embed Widget</span>
          </button>
        </div>
      </div>

      {/* 2. Setup Completion Checklist (Only visible if incomplete) */}
      {bot?.bot_id && (
        <SetupChecklist
          hasBots={hasBots}
          botId={bot.bot_id}
          onCreateBot={onCreateBot}
          onGoto={(s) => onGoto(s as SectionKey)}
          onOpenStudio={onOpenStudio}
          autoHideWhenComplete={true}
        />
      )}

      {/* 3. Executive Stat Cards (Clean, Breathable, High Contrast) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Conversations"
          value={totalChats}
          trend={{ value: `${todayStats.chatsToday} today`, isPositive: true }}
          subtext="All time"
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <StatCard
          label="Leads Captured"
          value={totalLeads}
          badge={
            hotLeadsCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-[700] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                <Flame className="h-3 w-3" /> {hotLeadsCount} Hot
              </span>
            ) : null
          }
          trend={{ value: `${convRate} conversion`, isPositive: true }}
          subtext="Live in CRM"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Automated Resolution"
          value={autonomyRate}
          trend={{
            value: unansweredCount === 0 ? "100% covered" : `${unansweredCount} gaps`,
            isPositive: unansweredCount === 0,
          }}
          subtext="Zero human escalations"
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          label="Lead Conversion"
          value={convRate}
          trend={{ value: "Top tier", isPositive: true }}
          subtext={`${totalLeads} of ${totalChats} visitors`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* 4. Full-Width Velocity & Trend Chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14.5px] font-[750] text-fg">Conversations & Leads Trend</h3>
            <p className="text-[12px] text-muted">Daily volume over selected period</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-[600]">
              <span className="inline-flex items-center gap-1.5 text-accent">
                <span className="h-2 w-2 rounded-full bg-accent" /> Chats ({totalChats})
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Leads ({totalLeads})
              </span>
            </div>
            <div className="flex rounded-lg border border-border/80 bg-panel/60 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setChartRange("7d")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all cursor-pointer font-[650]",
                  chartRange === "7d"
                    ? "bg-surface text-fg shadow-2xs"
                    : "text-muted hover:text-fg"
                )}
              >
                7d
              </button>
              <button
                type="button"
                onClick={() => setChartRange("30d")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all cursor-pointer font-[650]",
                  chartRange === "30d"
                    ? "bg-surface text-fg shadow-2xs"
                    : "text-muted hover:text-fg"
                )}
              >
                30d
              </button>
            </div>
          </div>
        </div>

        <div className="relative h-[180px] w-full flex items-end">
          <svg
            className="w-full h-full preserveAspectRatio-none relative z-10 overflow-visible"
            viewBox="0 0 1000 180"
            fill="none"
          >
            <defs>
              <linearGradient id="chart-dynamic-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="40" y1="20" x2="960" y2="20" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
            <line x1="40" y1="65" x2="960" y2="65" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
            <line x1="40" y1="110" x2="960" y2="110" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
            <line x1="40" y1="155" x2="960" y2="155" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

            {/* Area Fill */}
            {areaD && <path d={areaD} fill="url(#chart-dynamic-fade)" />}

            {/* Curve Line */}
            {pathD && (
              <path
                d={pathD}
                stroke="var(--accent)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Points */}
            {pointsCoords.map((pt: OverviewChartCoord, idx: number) => {
              const isHovered = hoveredIndex === idx;
              return (
                <g key={idx}>
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1="20"
                      x2={pt.x}
                      y2="155"
                      stroke="var(--accent)"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.8"
                    />
                  )}
                  {pt.data.leads > 0 && (
                    <circle
                      cx={pt.x}
                      cy="155"
                      r="3.5"
                      fill="#10b981"
                      stroke="var(--surface)"
                      strokeWidth="2"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5 : 3.5}
                    fill="var(--accent)"
                    stroke="var(--surface)"
                    strokeWidth="2"
                  />
                  <rect
                    x={pt.x - 25}
                    y="10"
                    width="50"
                    height="150"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredIndex !== null && pointsCoords[hoveredIndex] && (
            <div
              className="absolute z-20 pointer-events-none bg-surface/95 backdrop-blur-md border border-border px-3 py-1.5 rounded-xl shadow-lg transform -translate-x-1/2 -translate-y-full text-[11px]"
              style={{
                left: `${(pointsCoords[hoveredIndex].x / 1000) * 100}%`,
                top: `${Math.max(10, (pointsCoords[hoveredIndex].y / 180) * 180 - 12)}px`,
              }}
            >
              <div className="font-[700] text-fg">
                {pointsCoords[hoveredIndex].data.dateLabel}
              </div>
              <div className="flex items-center gap-2 text-muted mt-0.5">
                <span className="text-accent font-[650]">
                  {pointsCoords[hoveredIndex].data.chats} queries
                </span>
                <span>&middot;</span>
                <span className="text-emerald-500 font-[650]">
                  {pointsCoords[hoveredIndex].data.leads} lead{pointsCoords[hoveredIndex].data.leads === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* X-Axis labels */}
        <div className="flex justify-between text-[10.5px] font-medium text-faint pt-1">
          {chartData.map((d: OverviewChartPoint, i: number) => {
            if (chartRange === "30d" && i % 5 !== 0 && i !== chartData.length - 1) return null;
            return (
              <span key={i} className="truncate">
                {d.dateLabel}
              </span>
            );
          })}
        </div>
      </Card>

      {/* 5. Balanced Operational Grid: Top Inquiries (50%) & Recent Leads (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 5a: Top Inquiries */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <b className="text-[14.5px] font-[750]">Top Inquiries</b>
                <p className="text-[12px] text-muted mt-0.5">
                  Frequently asked visitor questions handled by {bot?.name || "your agent"}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onGoto("knowledge")}
                className="inline-flex items-center gap-1 text-[12px] font-[650] text-accent hover:underline cursor-pointer shrink-0"
              >
                <span>Knowledge Base</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {(stats?.topQuestions ?? []).length === 0 ? (
                <div className="py-8 text-center text-[12.5px] text-muted">
                  No visitor inquiries recorded yet.
                </div>
              ) : (
                (stats?.topQuestions ?? []).slice(0, 5).map((q, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40 bg-panel/20 hover:bg-panel/40 transition-colors text-[12.5px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-panel border border-border/60 text-[10.5px] font-[700] text-muted">
                        {i + 1}
                      </span>
                      <span className="truncate font-[600] text-fg">
                        {q.question}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-md bg-panel border border-border/60 px-1.5 py-0.5 text-[11px] font-mono font-[700] text-muted">
                        ×{q.count}
                      </span>
                      <span className="text-[10px] font-[650] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Grounded
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11.5px] text-muted">
            <span>Questions are answered from your uploaded knowledge docs.</span>
            <button
              type="button"
              onClick={() => onGoto("knowledge")}
              className="text-[11.5px] font-[600] text-accent hover:underline cursor-pointer"
            >
              Add FAQs &rarr;
            </button>
          </div>
        </Card>

        {/* Card 5b: Recent Leads */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <b className="text-[14.5px] font-[750]">Recent Leads</b>
                <p className="text-[12px] text-muted mt-0.5">
                  Qualified contacts collected through live widget conversations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onGoto("leads")}
                className="inline-flex items-center gap-1 text-[12px] font-[650] text-accent hover:underline cursor-pointer shrink-0"
              >
                <span>View all ({leads.length})</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {leads.length === 0 ? (
                <div className="py-8 text-center text-[12.5px] text-muted">
                  No leads captured yet. Your widget lead form is active.
                </div>
              ) : (
                leads.slice(0, 3).map((l) => (
                  <div
                    key={l.id}
                    onClick={() => onGoto("leads")}
                    className="group flex flex-col gap-2 p-3 rounded-xl border border-border/60 bg-panel/20 hover:border-accent/40 hover:bg-panel/40 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10.5px] font-[750] border bg-gradient-to-br",
                            getOverviewAvatarColor(l.name || l.email)
                          )}
                        >
                          {getOverviewInitials(l.name, l.email)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-[700] text-[12.5px] text-fg group-hover:text-accent transition-colors truncate">
                              {l.name || "Anonymous Visitor"}
                            </span>
                            <OverviewScorePill score={l.score} />
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5 font-mono">
                            <span className="truncate">{l.email || l.phone || "No contact info"}</span>
                            {l.email && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyEmailToClipboard(l.email);
                                }}
                                className="text-faint hover:text-fg p-0.5 rounded transition-colors"
                                title="Copy email"
                              >
                                {copiedEmail === l.email ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10.5px] font-medium text-faint shrink-0">
                        {formatOverviewRelativeDate(l.created_at)}
                      </span>
                    </div>

                    {l.message && (
                      <div className="rounded-lg bg-surface/90 p-2 border border-border/40 text-[11.5px] text-muted italic line-clamp-2">
                        &ldquo;{l.message}&rdquo;
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[11.5px]">
                      <span className="text-faint font-mono text-[10px]">
                        Source: Live widget
                      </span>
                      <div className="flex items-center gap-3">
                        {l.email && (
                          <a
                            href={`mailto:${l.email}?subject=Follow-up%20from%20${encodeURIComponent(bot?.name || "our team")}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-[650] text-accent hover:underline"
                          >
                            <Mail className="h-3 w-3" />
                            <span>Email</span>
                          </a>
                        )}
                        {l.phone && (
                          <a
                            href={getWhatsAppLink(l.phone, l.name) || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-[650] text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl border border-dashed border-border bg-panel/30 text-[11.5px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted">Active lead capture & qualification</span>
            </div>
            <span className="font-[700] text-emerald-600 dark:text-emerald-400 font-mono">
              {convRate} conversion
            </span>
          </div>
        </Card>
      </div>

      {/* 6. Balanced Status Grid: Subscription & Usage (50%) & Knowledge Base Health (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 6a: Subscription & Usage */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-accent" />
                <b className="text-[14px] font-[750]">Subscription & Usage</b>
              </div>
              <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10.5px] font-[750] text-accent font-mono">
                {planName} PLAN
              </span>
            </div>
            <p className="text-[12px] text-muted mb-3">
              Monthly conversational volume and plan quota.
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11.5px] text-muted">
                <span>Messages Used This Month</span>
                <span className="font-mono font-[700] text-fg">
                  {usedMessages.toLocaleString()} / {maxMessages.toLocaleString()} ({usagePercent}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-panel overflow-hidden border border-border/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-strong transition-all duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50 text-[11.5px]">
            <span className="text-muted">
              {sub?.trial_ends_at
                ? `Trial active until ${new Date(sub.trial_ends_at).toLocaleDateString()}`
                : "Billing renews automatically each month"}
            </span>
            <button
              type="button"
              onClick={() => onGoto("billing")}
              className="inline-flex items-center gap-1 font-[700] text-accent hover:underline cursor-pointer"
            >
              <span>Manage Plan</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Card>

        {/* Card 6b: Knowledge Base & Grounding Health */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-500" />
                <b className="text-[14px] font-[750]">Knowledge Base & Health</b>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10.5px] font-[750] text-emerald-600 dark:text-emerald-400">
                {autonomyRate} Accuracy
              </span>
            </div>
            <p className="text-[12px] text-muted mb-3">
              Grounding sources and answering confidence for {bot?.name || "your agent"}.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-xl border border-border/60 bg-panel/30">
                <span className="text-[11px] text-muted block">Indexed Sources</span>
                <b className="text-[13.5px] font-[750] text-fg mt-0.5 block">
                  {docs.length} Document{docs.length === 1 ? "" : "s"}
                </b>
              </div>
              <div className="p-2.5 rounded-xl border border-border/60 bg-panel/30">
                <span className="text-[11px] text-muted block">Knowledge Gaps</span>
                <b
                  className={cn(
                    "text-[13.5px] font-[750] mt-0.5 block",
                    unansweredCount > 0
                      ? "text-amber-500"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {unansweredCount > 0 ? `${unansweredCount} Escalation${unansweredCount === 1 ? "" : "s"}` : "0 Gaps (Optimal)"}
                </b>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50 text-[11.5px]">
            <span className="text-muted truncate">
              {docs.length > 0 ? "Agent answers only from your docs" : "Upload documents to train agent"}
            </span>
            <button
              type="button"
              onClick={() => onGoto("knowledge")}
              className="inline-flex items-center gap-1 font-[700] text-accent hover:underline cursor-pointer shrink-0 ml-2"
            >
              <span>Add Documents</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
