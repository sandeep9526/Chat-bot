"use client";

import { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { AdminApiError } from "@/lib/adminApi";
import { cn } from "@/lib/cn";
import {
  useAllBots,
  usePlatformStats,
  useSuspendBot,
  useSetOwnerPlan,
  useAllUsers,
  useAllLeads,
  usePlatformChats,
  usePlatformAnalytics,
  useDeleteUser,
} from "@/hooks/useSuperadmin";
import { VALID_PLANS, VALID_STATUSES, type PlatformBot, type PlatformUser, type PlatformLead, type PlatformChatStat } from "@/lib/superadminApi";
import { AppShell, SectionHeader, Card, type NavGroup } from "@/components/panel/AppShell";
import { AccountMenu } from "@/components/panel/AccountMenu";
import { ThemeToggle } from "@/components/panel/ThemeToggle";
import {
  OverviewIcon, TenantsIcon, SearchIcon, UsersIcon, ChatsIcon,
  RevenueIcon, BarChartIcon, LeadsIcon, DownloadIcon, DeleteIcon,
  AlertIcon, ActivityIcon, RefreshIcon,
} from "@/components/panel/panelIcons";
import { StatCard } from "@/components/admin/StatCard";
import { TestChatBox } from "@/components/admin/TestChatBox";

type SectionKey = "overview" | "users" | "bots" | "leads" | "chats" | "revenue" | "analytics";

const PLAN_MRR: Record<string, number> = {
  trial: 0, starter: 29, pro: 79, business: 199, enterprise: 499,
};

const LEAD_SCORE_COLOR = (score: number | null) => {
  if (!score) return "bg-muted/20 text-muted";
  if (score >= 70) return "bg-red-500/15 text-red-500";
  if (score >= 40) return "bg-amber-500/15 text-amber-600";
  return "bg-slate-500/15 text-slate-500";
};
const LEAD_SCORE_LABEL = (score: number | null) => {
  if (!score) return "—";
  if (score >= 70) return "🔥 Hot";
  if (score >= 40) return "🌡️ Warm";
  return "🧊 Cold";
};

export function SuperadminDashboard() {
  const { data: session, isPending } = useSession();
  if (isPending) return <Splash />;
  if (!session) return (
    <Centered>
      <EmptyCard title="Platform admin" body="Sign in with a platform admin account." cta={{ href: "/sign-in", label: "Sign in" }} />
    </Centered>
  );
  return <Dashboard email={session.user.email} name={session.user.name} />;
}

function Dashboard({ email, name }: { email: string; name?: string | null }) {
  const [section, setSection] = useState<SectionKey>("overview");
  const [query, setQuery] = useState("");
  const [inspectingBot, setInspectingBot] = useState<PlatformBot | null>(null);

  const { data: stats, isPending: statsPending, error: statsError } = usePlatformStats();
  const { data: bots, isPending: botsPending, error: botsError } = useAllBots();
  const { data: users, isPending: usersPending } = useAllUsers();
  const { data: leads, isPending: leadsPending } = useAllLeads();
  const { data: chats, isPending: chatsPending } = usePlatformChats();
  const { data: analytics, isPending: analyticsPending } = usePlatformAnalytics();

  const logout = async () => { await signOut(); window.location.href = "/sign-in"; };

  const deniedError = [statsError, botsError].find(
    (e): e is AdminApiError => e instanceof AdminApiError && e.status === 403,
  );
  if (deniedError) return (
    <Centered>
      <EmptyCard title="Not authorized" body="This account doesn't have platform admin access." cta={{ href: "/dashboard", label: "Go to my dashboard" }} />
    </Centered>
  );

  // Estimated MRR
  const estimatedMRR = (users ?? []).reduce((sum, u) => sum + (PLAN_MRR[u.plan ?? "trial"] ?? 0), 0);

  const groups: NavGroup[] = [{
    label: "Platform",
    items: [
      { key: "overview", label: "Overview", icon: <OverviewIcon className="h-[18px] w-[18px]" /> },
      { key: "users", label: "Users", icon: <UsersIcon className="h-[18px] w-[18px]" />, badge: users?.length ?? 0 },
      { key: "bots", label: "Bots", icon: <TenantsIcon className="h-[18px] w-[18px]" />, badge: bots?.length ?? 0 },
      { key: "leads", label: "Leads", icon: <LeadsIcon className="h-[18px] w-[18px]" />, badge: leads?.length ?? 0 },
      { key: "chats", label: "Chats", icon: <ChatsIcon className="h-[18px] w-[18px]" /> },
      { key: "revenue", label: "Revenue", icon: <RevenueIcon className="h-[18px] w-[18px]" /> },
      { key: "analytics", label: "E2E Analytics", icon: <BarChartIcon className="h-[18px] w-[18px]" /> },
    ],
  }];

  const sectionTitles: Record<SectionKey, string> = {
    overview: "Overview", users: "Users", bots: "Bots", leads: "Leads",
    chats: "Chats", revenue: "Revenue", analytics: "E2E Analytics",
  };

  const topbarRight = (
    <>
      <ThemeToggle />
      <AccountMenu name={name} email={email} onLogout={logout} />
    </>
  );

  const sidebarFooter = (
    <div className="flex items-center gap-2.5 px-1.5 py-1">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-[11px] font-[700] text-white">
        {(name || email).slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[12.5px] font-[650] text-fg">Platform admin</div>
        <div className="truncate text-[11px] text-faint">{email}</div>
      </div>
    </div>
  );

  const searchBar = (placeholder: string) => (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder={placeholder}
        className="w-[220px] rounded-r1 border border-border bg-surface py-2 pl-8 pr-3 text-[13px] text-fg outline-none focus:border-accent" />
    </div>
  );

  const q = query.toLowerCase();

  return (
    <AppShell brandLabel="Platform admin" groups={groups} activeKey={section}
      onNavigate={k => { setSection(k as SectionKey); setQuery(""); }}
      sectionTitle={sectionTitles[section]} topbarRight={topbarRight} sidebarFooter={sidebarFooter}>

      {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
      {section === "overview" && (
        <>
          <SectionHeader title="Platform at a glance" description="Real-time totals across every tenant." />
          <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
            <StatCard label="Total bots" value={statsPending ? "—" : stats?.totalBots ?? 0} hint="Across all clients" accent />
            <StatCard label="Accounts" value={statsPending ? "—" : stats?.totalOwners ?? 0} hint="Signed-up owners" />
            <StatCard label="Total leads" value={statsPending ? "—" : stats?.totalLeads ?? 0} hint="Platform-wide" />
            <StatCard label="Total chats" value={statsPending ? "—" : stats?.totalChats ?? 0} hint="Platform-wide" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 max-md:grid-cols-1">
            <StatCard label="Est. MRR" value={usersPending ? "—" : `$${estimatedMRR.toLocaleString()}`} hint="Based on active plans" />
            <StatCard label="Active users" value={usersPending ? "—" : (users ?? []).filter(u => u.status === "active").length} hint="Paid subscriptions" />
            <StatCard label="On trial" value={usersPending ? "—" : (users ?? []).filter(u => u.status === "trialing" || !u.status).length} hint="Free trial accounts" />
          </div>

          {stats && Object.keys(stats.byPlan).length > 0 && (
            <Card className="mt-6">
              <b className="text-[14px] font-[750]">Accounts by plan</b>
              <div className="mt-4 flex flex-col gap-2.5">
                {Object.entries(stats.byPlan).map(([plan, count]) => {
                  const total = Object.values(stats.byPlan).reduce((a, b) => a + b, 0);
                  const pct = total ? Math.round(count / total * 100) : 0;
                  const colors: Record<string, string> = {
                    trial: "bg-slate-400", starter: "bg-blue-500",
                    pro: "bg-violet-500", business: "bg-amber-500", enterprise: "bg-emerald-500",
                  };
                  return (
                    <div key={plan} className="flex items-center gap-3">
                      <span className="w-20 text-[12px] font-[600] capitalize text-muted">{plan}</span>
                      <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                        <div className={cn("h-full rounded-full", colors[plan] ?? "bg-accent")} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-[12px] font-[700] text-fg">{count}</span>
                      <span className="w-9 text-right text-[11px] text-faint">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Recent signups */}
          {(users ?? []).length > 0 && (
            <Card className="mt-4">
              <b className="text-[14px] font-[750]">Recent signups</b>
              <div className="mt-3 flex flex-col gap-1">
                {(users ?? []).slice(0, 8).map(u => (
                  <div key={u.user_id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                    <div>
                      <span className="text-[13px] font-[550] text-fg">{u.email}</span>
                      {u.name && <span className="ml-2 text-[12px] text-muted">({u.name})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <PlanBadge plan={u.plan} />
                      <span className="text-[11px] text-faint">{u.created_at?.slice(0, 10)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── USERS ────────────────────────────────────────────────────── */}
      {section === "users" && (
        <>
          <SectionHeader title="All Users" description="Every registered account. Change plan, status, or delete account."
            action={searchBar("Search by email…")} />
          <div className="overflow-x-auto rounded-r2 border border-border bg-surface shadow-panel">
            <table className="w-full min-w-[860px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border bg-panel text-left text-[11px] uppercase tracking-[.08em] text-faint">
                  <th className="px-4 py-2.5 font-[700]">User</th>
                  <th className="px-4 py-2.5 font-[700]">Plan</th>
                  <th className="px-4 py-2.5 font-[700]">Status</th>
                  <th className="px-4 py-2.5 font-[700]">Bots</th>
                  <th className="px-4 py-2.5 font-[700]">Joined</th>
                  <th className="px-4 py-2.5 font-[700]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersPending && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Loading…</td></tr>}
                {!usersPending && (users ?? []).filter(u => !q || (u.email ?? "").toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q)).map(u => (
                  <UserRow key={u.user_id} user={u} />
                ))}
                {!usersPending && (users ?? []).length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No users yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── BOTS ─────────────────────────────────────────────────────── */}
      {section === "bots" && (
        <>
          <SectionHeader title="All Bots" description="Every bot on the platform. Suspend or reactivate any bot."
            action={searchBar("Search bots, owners…")} />
          <div className="overflow-x-auto rounded-r2 border border-border bg-surface shadow-panel">
            <table className="w-full min-w-[760px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border bg-panel text-left text-[11px] uppercase tracking-[.08em] text-faint">
                  <th className="px-4 py-2.5 font-[700]">Bot</th>
                  <th className="px-4 py-2.5 font-[700]">Owner</th>
                  <th className="px-4 py-2.5 font-[700]">Plan</th>
                  <th className="px-4 py-2.5 font-[700]">Status</th>
                  <th className="px-4 py-2.5 font-[700]">Created</th>
                  <th className="px-4 py-2.5 font-[700]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {botsPending && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Loading…</td></tr>}
                {!botsPending && (bots ?? []).filter(b => !q || b.name.toLowerCase().includes(q) || b.bot_id.toLowerCase().includes(q) || (b.owner_email ?? "").toLowerCase().includes(q)).map(b => (
                  <BotRow key={b.bot_id} bot={b} onInspect={(b) => setInspectingBot(b)} />
                ))}
                {!botsPending && (bots ?? []).length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No bots on the platform yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {inspectingBot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="flex h-[720px] w-full max-w-4xl flex-col overflow-hidden rounded-r2 border border-border bg-surface shadow-2xl">
                <div className="flex items-center justify-between border-b border-border bg-panel px-6 py-4">
                  <div>
                    <h3 className="flex items-center gap-2.5 text-base font-[750] text-fg">
                      <span>🔬 Tenant Studio &amp; AI Engine Inspector</span>
                      <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-[11px] font-[700] text-accent">
                        Read-Only Debug Mode
                      </span>
                      {inspectingBot.suspended && (
                        <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 font-mono text-[11px] font-[700] text-red-500">
                          SUSPENDED BY ADMIN
                        </span>
                      )}
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      Direct interaction with tenant chatbot <b>{inspectingBot.name}</b> (<code>{inspectingBot.bot_id}</code>) &bull; Owner: {inspectingBot.owner_email || "unowned"} &bull; Plan: {inspectingBot.plan || "trial"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectingBot(null)}
                    className="rounded-[8px] border border-border bg-surface px-3 py-1.5 text-xs font-[600] text-muted hover:bg-panel hover:text-fg transition cursor-pointer"
                  >
                    Close Inspector ✕
                  </button>
                </div>
                <div className="flex flex-1 overflow-hidden p-6 gap-6 bg-surface/50">
                  <div className="w-1/3 flex flex-col gap-4 text-xs border-r border-border/80 pr-6">
                    <div>
                      <span className="font-[700] uppercase tracking-wider text-[10.5px] text-muted block mb-1">Bot Metadata</span>
                      <div className="rounded-[8px] border border-border bg-panel p-3.5 space-y-2 font-mono text-[11.5px]">
                        <div><span className="text-muted">Bot ID:</span> <span className="text-fg">{inspectingBot.bot_id}</span></div>
                        <div><span className="text-muted">Owner User ID:</span> <span className="text-fg">{inspectingBot.owner_user_id || "None"}</span></div>
                        <div><span className="text-muted">Created:</span> <span className="text-fg">{inspectingBot.created_at?.slice(0, 10)}</span></div>
                        <div><span className="text-muted">Active License:</span> <span className={inspectingBot.is_active ? "text-good" : "text-bad"}>{String(inspectingBot.is_active)}</span></div>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                      <div className="rounded-[8px] border border-accent/20 bg-accent/5 p-3.5 text-muted leading-relaxed">
                        💡 <b>Diagnostic Sandbox:</b> Responses generated here hit the live RAG vector similarity database and models configured for this tenant.
                      </div>
                    </div>
                  </div>
                  <div className="w-2/3 flex flex-col h-full">
                    <TestChatBox
                      bot={{
                        bot_id: inspectingBot.bot_id,
                        name: inspectingBot.name,
                        accent: inspectingBot.accent || "#4f46e5",
                        is_active: inspectingBot.is_active,
                        suspended: inspectingBot.suspended,
                      } as any}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── LEADS ────────────────────────────────────────────────────── */}
      {section === "leads" && (
        <>
          <SectionHeader title="All Leads" description="Every lead captured across all bots."
            action={
              <div className="flex items-center gap-2">
                {searchBar("Search leads…")}
                <button
                  onClick={() => exportCSV(leads ?? [], ["id","bot_id","name","email","phone","score","created_at","summary"], "zeva-leads.csv")}
                  className="flex items-center gap-1.5 rounded-r1 border border-border bg-surface px-3 py-2 text-[12.5px] font-[600] text-muted hover:bg-panel"
                >
                  <DownloadIcon className="h-3.5 w-3.5" /> Export CSV
                </button>
              </div>
            } />
          <div className="overflow-x-auto rounded-r2 border border-border bg-surface shadow-panel">
            <table className="w-full min-w-[700px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border bg-panel text-left text-[11px] uppercase tracking-[.08em] text-faint">
                  <th className="px-4 py-2.5 font-[700]">Lead</th>
                  <th className="px-4 py-2.5 font-[700]">Score</th>
                  <th className="px-4 py-2.5 font-[700]">Bot ID</th>
                  <th className="px-4 py-2.5 font-[700]">Time</th>
                </tr>
              </thead>
              <tbody>
                {leadsPending && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Loading…</td></tr>}
                {!leadsPending && (leads ?? []).filter(l => !q || (l.email ?? "").toLowerCase().includes(q) || (l.name ?? "").toLowerCase().includes(q) || l.bot_id.toLowerCase().includes(q)).map(l => (
                  <tr key={l.id} className="border-t border-border hover:bg-panel/50">
                    <td className="px-4 py-2.5">
                      <div className="font-[600] text-fg">{l.name || <span className="text-faint">Anonymous</span>}</div>
                      <div className="text-[11.5px] text-muted">{l.email}{l.phone && ` · ${l.phone}`}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-[700]", LEAD_SCORE_COLOR(l.score))}>
                        {LEAD_SCORE_LABEL(l.score)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-faint">{l.bot_id}</td>
                    <td className="px-4 py-2.5 text-[11.5px] text-muted">{l.created_at?.slice(0, 16).replace("T", " ")}</td>
                  </tr>
                ))}
                {!leadsPending && (leads ?? []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No leads yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CHATS ────────────────────────────────────────────────────── */}
      {section === "chats" && (
        <>
          <SectionHeader title="Chat Statistics" description="Per-bot conversation stats across all tenants." />
          <div className="overflow-x-auto rounded-r2 border border-border bg-surface shadow-panel">
            <table className="w-full min-w-[700px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border bg-panel text-left text-[11px] uppercase tracking-[.08em] text-faint">
                  <th className="px-4 py-2.5 font-[700]">Bot</th>
                  <th className="px-4 py-2.5 font-[700]">Owner</th>
                  <th className="px-4 py-2.5 font-[700]">Total Chats</th>
                  <th className="px-4 py-2.5 font-[700]">Sessions</th>
                  <th className="px-4 py-2.5 font-[700]">Top Question</th>
                  <th className="px-4 py-2.5 font-[700]">Unanswered</th>
                </tr>
              </thead>
              <tbody>
                {chatsPending && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Loading…</td></tr>}
                {!chatsPending && (chats ?? []).map(c => (
                  <tr key={c.bot_id} className="border-t border-border hover:bg-panel/50">
                    <td className="px-4 py-2.5 font-[600] text-fg">{c.bot_name}</td>
                    <td className="px-4 py-2.5 text-muted">{c.owner_email ?? <span className="text-faint">unowned</span>}</td>
                    <td className="px-4 py-2.5 font-[700] text-fg">{(c.total_chats ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-muted">{(c.total_sessions ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate text-[12px] text-muted" title={c.top_question ?? undefined}>
                      {c.top_question ?? <span className="text-faint">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {c.unanswered_count > 0 ? (
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-[700]",
                          c.unanswered_count / (c.total_chats || 1) > 0.3 ? "bg-red-500/15 text-red-500" : "bg-amber-500/15 text-amber-600"
                        )}>
                          {c.unanswered_count}
                        </span>
                      ) : <span className="text-[11.5px] text-good">✓ 0</span>}
                    </td>
                  </tr>
                ))}
                {!chatsPending && (chats ?? []).length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No chat data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── REVENUE ──────────────────────────────────────────────────── */}
      {section === "revenue" && (
        <>
          <SectionHeader title="Revenue" description="Plan distribution and estimated monthly recurring revenue." />
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
            <StatCard label="Est. MRR" value={usersPending ? "—" : `$${estimatedMRR.toLocaleString()}`} hint="Based on plan prices" accent />
            <StatCard label="Paid accounts" value={usersPending ? "—" : (users ?? []).filter(u => u.status === "active").length} hint="Active subscriptions" />
            <StatCard label="Trial accounts" value={usersPending ? "—" : (users ?? []).filter(u => !u.status || u.status === "trialing").length} hint="Free trial" />
          </div>

          <Card className="mt-6">
            <b className="text-[14px] font-[750]">Plan breakdown</b>
            <p className="mt-0.5 text-[12px] text-muted">MRR estimate per plan tier</p>
            <div className="mt-5 flex flex-col gap-3">
              {["enterprise", "business", "pro", "starter", "trial"].map(plan => {
                const count = (users ?? []).filter(u => (u.plan ?? "trial") === plan).length;
                const planMrr = count * (PLAN_MRR[plan] ?? 0);
                const totalUsers = (users ?? []).length || 1;
                const pct = Math.round(count / totalUsers * 100);
                const colors: Record<string, string> = {
                  trial: "bg-slate-400", starter: "bg-blue-500",
                  pro: "bg-violet-500", business: "bg-amber-500", enterprise: "bg-emerald-500",
                };
                return (
                  <div key={plan} className="flex items-center gap-3">
                    <span className="w-24 text-[12.5px] font-[600] capitalize text-muted">{plan}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-border overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", colors[plan] ?? "bg-accent")} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-[12px] font-[700] text-fg">{count}</span>
                    {planMrr > 0 && <span className="w-16 text-right text-[12px] font-[600] text-good">${planMrr.toLocaleString()}/mo</span>}
                  </div>
                );
              })}
            </div>
            <div className="mt-5 border-t border-border pt-4 flex items-center justify-between">
              <span className="text-[13px] font-[650] text-muted">Total estimated MRR</span>
              <span className="text-[20px] font-[800] text-fg">${estimatedMRR.toLocaleString()}<span className="text-[13px] font-[500] text-faint">/mo</span></span>
            </div>
          </Card>
        </>
      )}

      {/* ── E2E ANALYTICS ────────────────────────────────────────────── */}
      {section === "analytics" && (
        <>
          <SectionHeader title="E2E Analytics" description="Full end-to-end platform funnel, bot performance, and health metrics." />

          {analyticsPending && (
            <div className="flex items-center gap-2 py-10 justify-center text-muted">
              <RefreshIcon className="h-4 w-4 animate-spin" /> Loading analytics…
            </div>
          )}

          {analytics && (
            <>
              {/* Conversion funnel */}
              <Card>
                <b className="text-[14px] font-[750]">Conversion Funnel (Platform-wide)</b>
                <p className="mt-0.5 text-[12px] text-muted mb-5">How visitors move from sessions → messages → leads → hot leads</p>
                <div className="flex items-end gap-2 overflow-x-auto pb-2">
                  {[
                    { label: "Sessions", value: analytics.funnel.total_sessions, pct: 100, color: "bg-accent" },
                    { label: "Messages", value: analytics.funnel.total_messages, pct: analytics.funnel.total_sessions ? Math.min(100, Math.round(analytics.funnel.total_messages / analytics.funnel.total_sessions * 10)) : 0, color: "bg-blue-500" },
                    { label: "Leads", value: analytics.funnel.total_leads, pct: analytics.funnel.total_sessions ? Math.round(analytics.funnel.lead_capture_rate) : 0, color: "bg-violet-500" },
                    { label: "🔥 Hot Leads", value: analytics.funnel.hot_leads, pct: analytics.funnel.total_leads ? Math.round(analytics.funnel.hot_rate) : 0, color: "bg-red-500" },
                  ].map((step, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 min-w-[100px]">
                      <span className="text-[20px] font-[800] text-fg">{step.value.toLocaleString()}</span>
                      <div className="w-full h-12 bg-border rounded flex items-end overflow-hidden">
                        <div className={cn("w-full rounded transition-all", step.color)} style={{ height: `${Math.max(8, step.pct)}%` }} />
                      </div>
                      <span className="text-[11.5px] font-[600] text-muted text-center">{step.label}</span>
                      <span className="text-[10px] text-faint">{step.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-r2 border border-border bg-panel p-3">
                    <div className="text-[11px] text-faint uppercase tracking-wider mb-1">Lead Capture Rate</div>
                    <div className="text-[22px] font-[800] text-fg">{analytics.funnel.lead_capture_rate}%</div>
                    <div className="text-[11px] text-muted">sessions → leads</div>
                  </div>
                  <div className="rounded-r2 border border-border bg-panel p-3">
                    <div className="text-[11px] text-faint uppercase tracking-wider mb-1">Hot Lead Rate</div>
                    <div className="text-[22px] font-[800] text-fg">{analytics.funnel.hot_rate}%</div>
                    <div className="text-[11px] text-muted">leads → hot leads</div>
                  </div>
                </div>
              </Card>

              {/* Time-series */}
              <Card className="mt-4">
                <b className="text-[14px] font-[750]">Last 30 Days</b>
                <p className="mt-0.5 text-[12px] text-muted mb-4">Daily activity across chats, leads, and signups</p>
                <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                  <MiniSparkline label="Daily Chats" data={analytics.daily_chats} color="#6366f1" />
                  <MiniSparkline label="Daily Leads" data={analytics.daily_leads} color="#f59e0b" />
                  <MiniSparkline label="Daily Signups" data={analytics.daily_signups} color="#10b981" />
                </div>
              </Card>

              {/* Session metrics + Platform health side by side */}
              <div className="mt-4 grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <Card>
                  <b className="text-[14px] font-[750]">Session Metrics</b>
                  <div className="mt-4 flex flex-col gap-3">
                    <MetricRow label="Avg messages / session" value={`${analytics.session_metrics.avg_messages_per_session}`} />
                    <MetricRow label="Median messages / session" value={`${analytics.session_metrics.median_messages_per_session}`} />
                    <MetricRow label="Total unique sessions" value={analytics.funnel.total_sessions.toLocaleString()} />
                    <MetricRow label="Total messages" value={analytics.funnel.total_messages.toLocaleString()} />
                  </div>
                </Card>
                <Card>
                  <b className="text-[14px] font-[750]">Platform Health</b>
                  <div className="mt-4 flex flex-col gap-3">
                    <MetricRow label="Total bots" value={analytics.platform_health.total_bots.toString()} />
                    <MetricRow label="Active bots" value={analytics.platform_health.active_bots.toString()} good />
                    <MetricRow label="Suspended bots" value={analytics.platform_health.suspended_bots.toString()}
                      bad={analytics.platform_health.suspended_bots > 0} />
                    <MetricRow label="Unanswered rate"
                      value={`${analytics.platform_health.unanswered_rate}%`}
                      bad={analytics.platform_health.unanswered_rate > 20} />
                  </div>
                </Card>
              </div>

              {/* Lead quality */}
              <Card className="mt-4">
                <b className="text-[14px] font-[750]">Lead Quality Breakdown</b>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "🔥 Hot Leads", value: analytics.funnel.hot_leads, total: analytics.funnel.total_leads, color: "text-red-500 bg-red-500/10" },
                    { label: "🌡️ Warm Leads", value: analytics.funnel.warm_leads, total: analytics.funnel.total_leads, color: "text-amber-600 bg-amber-500/10" },
                    { label: "🧊 Cold Leads", value: analytics.funnel.cold_leads, total: analytics.funnel.total_leads, color: "text-slate-500 bg-slate-500/10" },
                  ].map(({ label, value, total, color }) => (
                    <div key={label} className={cn("rounded-r2 p-4 flex flex-col gap-1", color.split(" ")[1])}>
                      <span className="text-[12px] font-[600]">{label}</span>
                      <span className={cn("text-[26px] font-[800]", color.split(" ")[0])}>{value.toLocaleString()}</span>
                      <span className="text-[11px] text-muted">{total ? Math.round(value / total * 100) : 0}% of all leads</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Bot performance table */}
              <Card className="mt-4">
                <b className="text-[14px] font-[750]">Bot Performance Scorecard</b>
                <p className="mt-0.5 text-[12px] text-muted mb-4">Ranked by leads generated. Conversion = leads ÷ sessions.</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-faint">
                        <th className="pb-2 font-[700]">#</th>
                        <th className="pb-2 font-[700]">Bot</th>
                        <th className="pb-2 font-[700]">Owner</th>
                        <th className="pb-2 font-[700] text-right">Sessions</th>
                        <th className="pb-2 font-[700] text-right">Leads</th>
                        <th className="pb-2 font-[700] text-right">🔥 Hot</th>
                        <th className="pb-2 font-[700] text-right">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.bot_performance.map((b, i) => (
                        <tr key={b.bot_id} className="border-t border-border/60">
                          <td className="py-2 pr-3 text-[12px] text-faint font-mono">{i + 1}</td>
                          <td className="py-2 font-[600] text-fg">{b.bot_name}</td>
                          <td className="py-2 text-muted text-[12px]">{b.owner_email ?? "—"}</td>
                          <td className="py-2 text-right text-muted">{b.sessions.toLocaleString()}</td>
                          <td className="py-2 text-right font-[700] text-fg">{b.leads}</td>
                          <td className="py-2 text-right text-red-500 font-[600]">{b.hot_leads}</td>
                          <td className="py-2 text-right">
                            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-[700]",
                              b.conversion_rate >= 5 ? "bg-good/15 text-good" :
                              b.conversion_rate >= 1 ? "bg-amber-500/15 text-amber-600" :
                              "bg-border text-faint"
                            )}>
                              {b.conversion_rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {analytics.bot_performance.length === 0 && (
                        <tr><td colSpan={7} className="py-6 text-center text-muted">No bot performance data yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}

/* ─────────────── Sub-components ─────────────── */

function UserRow({ user: u }: { user: PlatformUser }) {
  const setPlan = useSetOwnerPlan();
  const deleteU = useDeleteUser();
  const [plan, setPlanValue] = useState<string>(u.plan ?? "trial");
  const [status, setStatusValue] = useState<string>(u.status ?? "trialing");

  const onSave = () => {
    setPlan.mutate({ ownerUserId: u.user_id, plan: plan as never, status: status as never });
  };

  const onDelete = () => {
    if (!window.confirm(`⚠️ Permanently delete "${u.email}" and all their bots? This cannot be undone.`)) return;
    deleteU.mutate(u.user_id);
  };

  return (
    <tr className="border-t border-border hover:bg-panel/40">
      <td className="px-4 py-2.5">
        <div className="font-[600] text-fg">{u.email}</div>
        {u.name && <div className="text-[11.5px] text-muted">{u.name}</div>}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1 flex-wrap">
          <select value={plan} onChange={e => setPlanValue(e.target.value)}
            className="rounded-[6px] border border-border bg-panel px-1.5 py-1 text-[11.5px] text-fg outline-none focus:border-accent">
            {VALID_PLANS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={status} onChange={e => setStatusValue(e.target.value)}
            className="rounded-[6px] border border-border bg-panel px-1.5 py-1 text-[11.5px] text-fg outline-none focus:border-accent">
            {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={onSave} disabled={setPlan.isPending || (plan === u.plan && status === u.status)}
            className="cursor-pointer rounded-[6px] bg-accent px-2 py-1 text-[11px] font-[600] text-white disabled:cursor-not-allowed disabled:opacity-40">
            Save
          </button>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge status={u.status} />
      </td>
      <td className="px-4 py-2.5 text-center font-[700] text-fg">{u.bot_count}</td>
      <td className="px-4 py-2.5 font-mono text-[11.5px] text-faint">{u.created_at?.slice(0, 10)}</td>
      <td className="px-4 py-2.5">
        <button onClick={onDelete} disabled={deleteU.isPending}
          className="flex items-center gap-1 rounded-[6px] px-2 py-1 text-[11.5px] font-[600] text-red-500 hover:bg-red-500/10 disabled:opacity-40">
          <DeleteIcon className="h-3.5 w-3.5" /> Delete
        </button>
      </td>
    </tr>
  );
}

function BotRow({ bot: b, onInspect }: { bot: PlatformBot; onInspect?: (bot: PlatformBot) => void }) {
  const suspend = useSuspendBot();
  const setPlan = useSetOwnerPlan();
  const [plan, setPlanValue] = useState(b.plan ?? "trial");
  const [status, setStatusValue] = useState(b.status ?? "trialing");

  const onToggleSuspend = () => {
    if (!window.confirm(b.suspended
      ? `Reactivate "${b.name}"?`
      : `Suspend "${b.name}"? Its chat will go dark immediately.`
    )) return;
    suspend.mutate({ botId: b.bot_id, suspended: !b.suspended });
  };

  const onSavePlan = () => {
    if (!b.owner_user_id) return;
    setPlan.mutate({ ownerUserId: b.owner_user_id, plan: plan as never, status: status as never });
  };

  return (
    <tr className="border-t border-border hover:bg-panel/40">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: b.accent }} />
          <span className="font-[600] text-fg">{b.name}</span>
        </div>
        <div className="font-mono text-[11px] text-faint">{b.bot_id}</div>
      </td>
      <td className="px-4 py-2.5 text-muted">{b.owner_email ?? <span className="text-faint">unowned</span>}</td>
      <td className="px-4 py-2.5">
        {b.owner_user_id ? (
          <div className="flex items-center gap-1">
            <select value={plan} onChange={e => setPlanValue(e.target.value)}
              className="rounded-[6px] border border-border bg-panel px-1.5 py-1 text-[11.5px] text-fg outline-none focus:border-accent">
              {VALID_PLANS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={status} onChange={e => setStatusValue(e.target.value)}
              className="rounded-[6px] border border-border bg-panel px-1.5 py-1 text-[11.5px] text-fg outline-none focus:border-accent">
              {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={onSavePlan} disabled={setPlan.isPending || (plan === b.plan && status === b.status)}
              className="cursor-pointer rounded-[6px] bg-accent px-2 py-1 text-[11px] font-[600] text-white disabled:cursor-not-allowed disabled:opacity-40">
              Save
            </button>
          </div>
        ) : <span className="text-muted">—</span>}
      </td>
      <td className="px-4 py-2.5">
        <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] font-[700]",
          b.suspended ? "bg-red-500/15 text-red-500" : b.is_active ? "bg-good/15 text-good" : "bg-red-500/15 text-red-500"
        )}>
          {b.suspended ? "suspended" : b.is_active ? "active" : "inactive"}
        </span>
      </td>
      <td className="px-4 py-2.5 font-mono text-[11.5px] text-faint">{b.created_at?.slice(0, 10)}</td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onInspect?.(b)}
            className="cursor-pointer rounded-[6px] border border-border bg-panel px-2 py-1 text-[11px] font-[600] text-fg transition hover:border-accent hover:text-accent flex items-center gap-1"
          >
            <span>🔬</span> Open in Studio Inspector
          </button>
          <button onClick={onToggleSuspend} disabled={suspend.isPending}
            className={cn("cursor-pointer rounded-[6px] px-2 py-1 text-[11.5px] font-[600] disabled:opacity-40",
              b.suspended ? "text-good hover:bg-good/10" : "text-red-500 hover:bg-red-500/10"
            )}>
            {b.suspended ? "Reactivate" : "Suspend"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function PlanBadge({ plan }: { plan: string | null }) {
  const colors: Record<string, string> = {
    trial: "bg-slate-400/15 text-slate-500",
    starter: "bg-blue-500/15 text-blue-600",
    pro: "bg-violet-500/15 text-violet-600",
    business: "bg-amber-500/15 text-amber-600",
    enterprise: "bg-emerald-500/15 text-emerald-600",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-[700] capitalize", colors[plan ?? "trial"] ?? colors.trial)}>
      {plan ?? "trial"}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "trialing";
  const color = s === "active" ? "bg-good/15 text-good"
    : s === "trialing" ? "bg-blue-500/15 text-blue-600"
    : "bg-red-500/15 text-red-500";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-[700]", color)}>{s}</span>
  );
}

function MetricRow({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted">{label}</span>
      <span className={cn("text-[13px] font-[700]", good ? "text-good" : bad ? "text-red-500" : "text-fg")}>{value}</span>
    </div>
  );
}

function MiniSparkline({ label, data, color }: { label: string; data: { date: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="rounded-r2 border border-border bg-panel p-3">
      <div className="text-[12px] font-[650] text-muted mb-1">{label}</div>
      <div className="text-[22px] font-[800] text-fg mb-3">{total.toLocaleString()}</div>
      <div className="flex items-end gap-0.5 h-12">
        {data.length === 0 && <span className="text-[11px] text-faint">No data yet</span>}
        {data.map((d, i) => (
          <div key={i} className="flex-1 rounded-t" style={{
            background: color,
            height: `${Math.max(4, (d.count / max) * 100)}%`,
            opacity: 0.7 + (i / data.length) * 0.3,
          }} title={`${d.date}: ${d.count}`} />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-faint">{data[0]?.date?.slice(5) ?? ""}</span>
        <span className="text-[10px] text-faint">{data[data.length - 1]?.date?.slice(5) ?? ""}</span>
      </div>
    </div>
  );
}

/* ── CSV export helper ── */
function exportCSV(rows: Record<string, unknown>[], cols: string[], filename: string) {
  const header = cols.join(",");
  const body = rows.map(r => cols.map(c => JSON.stringify(r[c] ?? "")).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ── Misc layout helpers ── */
function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center bg-bg px-4">{children}</div>;
}

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg">
      <div className="flex items-center gap-2.5 text-muted">
        <span className="h-2.5 w-2.5 animate-blink rounded-full bg-accent" />
        <span className="text-[13px]">Loading platform admin…</span>
      </div>
    </div>
  );
}

function EmptyCard({ title, body, cta }: { title: string; body: React.ReactNode; cta?: { href: string; label: string } }) {
  return (
    <div className="w-[380px] max-w-full rounded-r3 border border-border bg-surface p-7 text-center shadow-panel">
      <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-r2 bg-gradient-to-br from-accent to-accent-strong text-white shadow-panel">
        <TenantsIcon className="h-5 w-5" />
      </div>
      <b className="text-[17px] font-[750]">{title}</b>
      <p className="mb-5 mt-2 text-[13.5px] leading-relaxed text-muted">{body}</p>
      {cta && (
        <a href={cta.href} className="inline-block w-full rounded-r1 bg-gradient-to-br from-accent to-accent-strong py-2.5 text-[14px] font-[650] text-white shadow-panel hover:opacity-90">
          {cta.label}
        </a>
      )}
    </div>
  );
}


