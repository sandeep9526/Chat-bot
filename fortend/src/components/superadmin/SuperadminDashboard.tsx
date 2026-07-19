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
} from "@/hooks/useSuperadmin";
import { VALID_PLANS, VALID_STATUSES, type PlatformBot } from "@/lib/superadminApi";

import { AppShell, SectionHeader, Card, type NavGroup } from "@/components/panel/AppShell";
import { AccountMenu } from "@/components/panel/AccountMenu";
import { ThemeToggle } from "@/components/panel/ThemeToggle";
import { OverviewIcon, TenantsIcon, SearchIcon } from "@/components/panel/panelIcons";
import { StatCard } from "@/components/admin/StatCard";

type SectionKey = "overview" | "tenants";

/**
 * Cross-tenant platform admin view. Access is enforced server-side by
 * PLATFORM_ADMIN_EMAILS (main.py) — the checks here are only for a clean UX;
 * the real gate is the backend's 403, which every branch below respects.
 */
export function SuperadminDashboard() {
  const { data: session, isPending } = useSession();

  if (isPending) return <Splash />;

  if (!session) {
    return (
      <Centered>
        <EmptyCard
          title="Platform admin"
          body="Sign in with a platform admin account to see every tenant."
          cta={{ href: "/sign-in", label: "Sign in" }}
        />
      </Centered>
    );
  }

  return <Dashboard email={session.user.email} name={session.user.name} />;
}

function Dashboard({ email, name }: { email: string; name?: string | null }) {
  const { data: stats, error: statsError, isPending: statsPending } = usePlatformStats();
  const { data: bots, error: botsError, isPending: botsPending } = useAllBots();
  const [section, setSection] = useState<SectionKey>("overview");
  const [query, setQuery] = useState("");

  const logout = async () => {
    await signOut();
    window.location.href = "/sign-in";
  };

  const deniedError = [statsError, botsError].find(
    (e): e is AdminApiError => e instanceof AdminApiError && e.status === 403,
  );
  if (deniedError) {
    return (
      <Centered>
        <EmptyCard
          title="Not authorized"
          body="This account doesn't have platform admin access. If you're looking for your own bots, head to your dashboard instead."
          cta={{ href: "/dashboard", label: "Go to my dashboard" }}
        />
      </Centered>
    );
  }

  const otherError = statsError || botsError;
  if (otherError) {
    return (
      <Centered>
        <EmptyCard title="Couldn't load" body={(otherError as Error).message} />
      </Centered>
    );
  }

  const groups: NavGroup[] = [
    {
      label: "Platform",
      items: [
        { key: "overview", label: "Overview", icon: <OverviewIcon className="h-[18px] w-[18px]" /> },
        {
          key: "tenants",
          label: "Tenants",
          icon: <TenantsIcon className="h-[18px] w-[18px]" />,
          badge: bots?.length ?? 0,
        },
      ],
    },
  ];

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

  const filtered = (bots ?? []).filter((b) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.bot_id.toLowerCase().includes(q) ||
      (b.owner_email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AppShell
      brandLabel="Platform admin"
      groups={groups}
      activeKey={section}
      onNavigate={(k) => setSection(k as SectionKey)}
      sectionTitle={section === "overview" ? "Overview" : "Tenants"}
      topbarRight={topbarRight}
      sidebarFooter={sidebarFooter}
    >
      {section === "overview" && (
        <>
          <SectionHeader title="Every client, at a glance" description="Platform-wide totals across all tenants." />
          <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
            <StatCard label="Total bots" value={statsPending ? "—" : stats?.totalBots ?? 0} hint="Across every client" accent />
            <StatCard label="Accounts" value={statsPending ? "—" : stats?.totalOwners ?? 0} hint="Signed-up owners" />
            <StatCard label="Total leads" value={statsPending ? "—" : stats?.totalLeads ?? 0} hint="Platform-wide" />
            <StatCard label="Total chats" value={statsPending ? "—" : stats?.totalChats ?? 0} hint="Platform-wide" />
          </div>

          {stats && Object.keys(stats.byPlan).length > 0 && (
            <Card className="mt-6">
              <b className="text-[14px] font-[750]">Accounts by plan</b>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(stats.byPlan).map(([plan, count]) => (
                  <span
                    key={plan}
                    className="rounded-full border border-border bg-panel px-3 py-1 text-[12.5px] font-[600] text-muted"
                  >
                    {plan}: <b className="text-fg">{count}</b>
                  </span>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {section === "tenants" && (
        <>
          <SectionHeader
            title="Tenants"
            description="Every bot on the platform. Suspend a bot or change an account's plan."
            action={
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search bots, owners…"
                  className="w-[220px] rounded-r1 border border-border bg-surface py-2 pl-8 pr-3 text-[13px] text-fg outline-none focus:border-accent"
                />
              </div>
            }
          />

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
                {botsPending && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">Loading…</td>
                  </tr>
                )}
                {!botsPending && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      {query ? "No bots match your search." : "No bots on the platform yet."}
                    </td>
                  </tr>
                )}
                {filtered.map((b) => (
                  <BotRow key={b.bot_id} bot={b} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}

function BotRow({ bot: b }: { bot: PlatformBot }) {
  const suspend = useSuspendBot();
  const setPlan = useSetOwnerPlan();
  const [plan, setPlanValue] = useState(b.plan ?? "trial");
  const [status, setStatusValue] = useState(b.status ?? "trialing");

  const onToggleSuspend = () => {
    if (
      !window.confirm(
        b.suspended
          ? `Reactivate "${b.name}"? Its chat will start answering again.`
          : `Suspend "${b.name}"? Its chat will go dark immediately, same as an expired plan.`,
      )
    )
      return;
    suspend.mutate({ botId: b.bot_id, suspended: !b.suspended });
  };

  const onSavePlan = () => {
    if (!b.owner_user_id) return;
    setPlan.mutate({
      ownerUserId: b.owner_user_id,
      plan: plan as (typeof VALID_PLANS)[number],
      status: status as (typeof VALID_STATUSES)[number],
    });
  };

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: b.accent }} />
          <span className="font-[600] text-fg">{b.name}</span>
        </div>
        <div className="font-mono text-[11px] text-faint">{b.bot_id}</div>
      </td>
      <td className="px-4 py-2.5 text-muted">
        {b.owner_email ?? <span className="text-faint">unowned (demo)</span>}
      </td>
      <td className="px-4 py-2.5">
        {b.owner_user_id ? (
          <div className="flex items-center gap-1">
            <select
              value={plan}
              onChange={(e) => setPlanValue(e.target.value)}
              className="rounded-[6px] border border-border bg-panel px-1.5 py-1 text-[11.5px] text-fg outline-none focus:border-accent"
            >
              {VALID_PLANS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatusValue(e.target.value)}
              className="rounded-[6px] border border-border bg-panel px-1.5 py-1 text-[11.5px] text-fg outline-none focus:border-accent"
            >
              {VALID_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={onSavePlan}
              disabled={setPlan.isPending || (plan === b.plan && status === b.status)}
              className="cursor-pointer rounded-[6px] bg-accent px-2 py-1 text-[11px] font-[600] text-white disabled:cursor-not-allowed disabled:opacity-40"
              title="Applies to this account's whole plan, not just this one bot"
            >
              Save
            </button>
          </div>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-2.5">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[10px] font-[700]",
            b.suspended
              ? "bg-red-500/15 text-red-500"
              : b.is_active
                ? "bg-good/15 text-good"
                : "bg-red-500/15 text-red-500",
          )}
        >
          {b.suspended ? "suspended" : b.is_active ? "active" : "inactive"}
        </span>
      </td>
      <td className="px-4 py-2.5 font-mono text-[11.5px] text-faint">{b.created_at?.slice(0, 10)}</td>
      <td className="px-4 py-2.5">
        <button
          type="button"
          onClick={onToggleSuspend}
          disabled={suspend.isPending}
          className={cn(
            "cursor-pointer rounded-[6px] px-2 py-1 text-[11.5px] font-[600] disabled:cursor-not-allowed disabled:opacity-40",
            b.suspended ? "text-good hover:bg-good/10" : "text-red-500 hover:bg-red-500/10",
          )}
        >
          {b.suspended ? "Reactivate" : "Suspend"}
        </button>
      </td>
    </tr>
  );
}

/* ---------------- shared ---------------- */

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

function EmptyCard({
  title,
  body,
  cta,
}: {
  title: string;
  body: React.ReactNode;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="w-[380px] max-w-full rounded-r3 border border-border bg-surface p-7 text-center shadow-panel">
      <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-r2 bg-gradient-to-br from-accent to-accent-strong text-white shadow-panel">
        <TenantsIcon className="h-5 w-5" />
      </div>
      <b className="text-[17px] font-[750]">{title}</b>
      <p className="mb-5 mt-2 text-[13.5px] leading-relaxed text-muted">{body}</p>
      {cta && (
        <a
          href={cta.href}
          className="inline-block w-full rounded-r1 bg-gradient-to-br from-accent to-accent-strong py-2.5 text-[14px] font-[650] text-white shadow-panel hover:opacity-90"
        >
          {cta.label}
        </a>
      )}
    </div>
  );
}
