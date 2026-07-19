"use client";

import { useEffect, useRef, useState } from "react";
import {
  useBots,
  useStats,
  useLeads,
  useHandoffs,
  useSubscription,
} from "@/hooks/useAdmin";
import { getPendingDesign } from "@/lib/pendingDesign";
import { ADMIN_ENABLED, type AdminBot, type AdminLead } from "@/lib/adminApi";
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

import { AppShell, SectionHeader, Card, type NavGroup } from "@/components/panel/AppShell";
import { AccountMenu } from "@/components/panel/AccountMenu";
import { BotSwitcher } from "@/components/panel/BotSwitcher";
import { ThemeToggle } from "@/components/panel/ThemeToggle";
import { InstallCard } from "@/components/panel/InstallCard";
import {
  OverviewIcon,
  PlaygroundIcon,
  LeadsIcon,
  KnowledgeIcon,
  InstallIcon,
  AppearanceIcon,
  BillingIcon,
  SettingsIcon,
  ExternalLinkIcon,
} from "@/components/panel/panelIcons";

import { StatCard } from "./StatCard";
import { LeadsTable } from "./LeadsTable";
import { DocsUpload } from "./DocsUpload";
import { TestChatBox } from "./TestChatBox";
import { BillingCard } from "./BillingCard";
import { BotsSection } from "./BotsSection";
import { DashboardTour } from "./DashboardTour";
import { SetupChecklist } from "./SetupChecklist";

/** Small robot mark for the Bots nav item. */
function BotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M12 8V4M9 13h.01M15 13h.01M9 17h6" />
    </svg>
  );
}

/* ============================ Section routing ============================ */

const SECTIONS = [
  "overview",
  "bots",
  "playground",
  "leads",
  "knowledge",
  "install",
  "billing",
  "settings",
] as const;
type SectionKey = (typeof SECTIONS)[number];

const TITLES: Record<SectionKey, string> = {
  overview: "Overview",
  bots: "Bots",
  playground: "Playground",
  leads: "Leads",
  knowledge: "Knowledge base",
  install: "Install",
  billing: "Billing & usage",
  settings: "Settings",
};

function readHash(): SectionKey {
  if (typeof window === "undefined") return "overview";
  const h = window.location.hash.replace("#", "") as SectionKey;
  return SECTIONS.includes(h) ? h : "overview";
}

/** Keep the active section in the URL hash so refresh / back-button work. */
function useHashSection(): [SectionKey, (s: SectionKey) => void] {
  // Lazy initializer (client-only component) avoids a synchronous setState in
  // the mount effect; the effect below only subscribes to later hash changes.
  const [section, setSection] = useState<SectionKey>(readHash);

  useEffect(() => {
    const read = () => setSection(readHash());
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const navigate = (s: SectionKey) => {
    window.location.hash = s;
    setSection(s);
  };
  return [section, navigate];
}

/* ============================ Entry / gating ============================ */

export function AdminDashboard() {
  const { data: session, isPending } = useSession();

  if (!ADMIN_ENABLED) {
    return (
      <Centered>
        <EmptyCard
          title="Backend not configured"
          body={
            <>
              Set <code className="font-mono text-[12px]">NEXT_PUBLIC_API_URL</code> to your Zeva
              backend URL, then reload.
            </>
          }
        />
      </Centered>
    );
  }

  if (isPending) return <Splash />;

  if (!session) {
    return (
      <Centered>
        <EmptyCard
          title="Sign in to Zeva"
          body="Log in to see your leads, chats, and knowledge base."
          cta={{ href: "/sign-in", label: "Sign in" }}
        />
      </Centered>
    );
  }

  return <Dashboard email={session.user.email} name={session.user.name} />;
}

/* ============================ Dashboard shell ============================ */

function Dashboard({ email, name }: { email: string; name?: string | null }) {
  const { data: bots, isPending: botsPending } = useBots();

  const [selectedBotId, setSelectedBotId] = useState("");
  const botId = selectedBotId || bots?.[0]?.bot_id || "";
  const activeBot = (bots ?? []).find((b) => b.bot_id === botId);

  const { data: stats } = useStats(botId);
  const { data: leads } = useLeads(botId);
  const { data: handoffs } = useHandoffs(botId);
  const { data: sub } = useSubscription();

  const [section, navigate] = useHashSection();

  // Arrived from "Make it yours" and already have bots → jump to the Bots
  // section so its pre-filled create modal can open (0-bot accounts are forced
  // there anyway). Runs once, after bots load.
  const jumpedForDesign = useRef(false);
  useEffect(() => {
    if (jumpedForDesign.current) return;
    if (getPendingDesign() && (bots ?? []).length > 0) {
      jumpedForDesign.current = true;
      const raf = requestAnimationFrame(() => navigate("bots"));
      return () => cancelAnimationFrame(raf);
    }
  }, [bots, navigate]);

  const logout = async () => {
    await signOut();
    window.location.href = "/sign-in";
  };

  // Studio is a full-width tool with its own layout, so it lives on its own
  // page rather than inside the dashboard content column. The sidebar item
  // just deep-links there, scoped to the currently selected bot.
  const openStudio = () => {
    window.location.href = `/studio?bot=${encodeURIComponent(botId)}`;
  };

  if (botsPending) return <Splash />;

  // A brand-new account (no bots yet) still gets the full dashboard shell — the
  // Bots section shows a "create your first bot" prompt and the tour runs —
  // rather than a dead-end card. This is the onboarding, in-context.
  const noBots = (bots ?? []).length === 0;
  const activeSection: SectionKey = noBots ? "bots" : section;

  const leadsCount = leads?.length ?? 0;

  const groups: NavGroup[] = [
    {
      label: "Workspace",
      items: [
        { key: "overview", label: "Overview", icon: <OverviewIcon className="h-[18px] w-[18px]" /> },
        { key: "bots", label: "Bots", icon: <BotsIcon className="h-[18px] w-[18px]" />, badge: bots?.length ?? undefined, tour: "nav-bots" },
        { key: "playground", label: "Playground", icon: <PlaygroundIcon className="h-[18px] w-[18px]" /> },
        { key: "leads", label: "Leads", icon: <LeadsIcon className="h-[18px] w-[18px]" />, badge: leadsCount, tour: "nav-leads" },
        { key: "knowledge", label: "Knowledge", icon: <KnowledgeIcon className="h-[18px] w-[18px]" />, tour: "nav-knowledge" },
        { key: "appearance", label: "Appearance", icon: <AppearanceIcon className="h-[18px] w-[18px]" />, tour: "nav-appearance" },
        { key: "install", label: "Install", icon: <InstallIcon className="h-[18px] w-[18px]" />, tour: "nav-install" },
      ],
    },
    {
      label: "Account",
      items: [
        { key: "billing", label: "Billing", icon: <BillingIcon className="h-[18px] w-[18px]" /> },
        { key: "settings", label: "Settings", icon: <SettingsIcon className="h-[18px] w-[18px]" /> },
      ],
    },
  ];

  const topbarRight = (
    <>
      {bots && (
        <span data-tour="bot-switcher">
          <BotSwitcher
            bots={bots}
            activeBotId={botId}
            onSelect={setSelectedBotId}
            onCreate={() => navigate("bots")}
          />
        </span>
      )}
      <ThemeToggle />
      <AccountMenu
        name={name}
        email={email}
        onLogout={logout}
        onSettings={() => navigate("settings")}
      />
    </>
  );

  const sidebarFooter = (
    <div className="flex items-center gap-2.5 px-1.5 py-1">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-[11px] font-[700] text-white">
        {(name || email).slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[12.5px] font-[650] text-fg">{name || "Signed in"}</div>
        <div className="truncate text-[11px] text-faint">{email}</div>
      </div>
    </div>
  );

  return (
    <AppShell
      brandLabel="Dashboard"
      groups={groups}
      activeKey={activeSection}
      onNavigate={(k) => {
        // "Appearance" isn't a dashboard section — it deep-links to the
        // full-width Studio page for the current bot.
        if (k === "appearance") {
          openStudio();
          return;
        }
        navigate(k as SectionKey);
      }}
      sectionTitle={TITLES[activeSection]}
      topbarRight={topbarRight}
      sidebarFooter={sidebarFooter}
    >
      <DashboardTour
        hasBots={(bots ?? []).length > 0}
        userKey={email}
        onGoto={(s) => navigate(s as SectionKey)}
      />

      {(activeSection === "overview" || activeSection === "bots") && (
        <SetupChecklist
          hasBots={!noBots}
          botId={botId}
          onCreateBot={() => navigate("bots")}
          onGoto={(s) => navigate(s as SectionKey)}
          onOpenStudio={openStudio}
        />
      )}

      {activeSection === "overview" && (
        <OverviewSection
          bot={activeBot}
          name={name}
          stats={stats}
          leads={leads ?? []}
          handoffs={handoffs ?? []}
          onGoto={navigate}
        />
      )}

      {activeSection === "bots" && (
        <BotsSection
          bots={bots ?? []}
          activeBotId={botId}
          maxBots={sub?.max_bots}
          onSelect={(id) => {
            setSelectedBotId(id);
            navigate("overview");
          }}
          onOpenInstall={(id) => {
            setSelectedBotId(id);
            navigate("install");
          }}
        />
      )}

      {activeSection === "playground" && (
        <>
          <SectionHeader
            title="Playground"
            description="Try your bot before your visitors do. Every message here runs through the real engine and updates your stats."
          />
          {botId && <TestChatBox botId={botId} />}
        </>
      )}

      {activeSection === "leads" && (
        <>
          <SectionHeader
            title="Leads"
            description="Everyone who left their details in the chat. Export to CSV or remove on request."
          />
          <LeadsTable leads={leads ?? []} />
          <div className="mt-6">
            <HandoffsCard handoffs={handoffs ?? []} />
          </div>
        </>
      )}

      {activeSection === "knowledge" && (
        <>
          <SectionHeader
            title="Knowledge base"
            description="What your bot knows. Add pricing, FAQs, hours, policies — the clearer the text, the better the answers."
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {botId && <DocsUpload botId={botId} />}
            <UnansweredCard stats={stats} />
          </div>
        </>
      )}

      {activeSection === "install" && (
        <>
          <SectionHeader
            title="Install"
            description="Add the chat widget to your website. Copy the snippet, paste it once, you're live."
          />
          {activeBot && <InstallCard bot={activeBot} />}
        </>
      )}

      {activeSection === "billing" && (
        <>
          <SectionHeader
            title="Billing & usage"
            description="Your plan, limits, and how much you've used this month."
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <BillingCard />
            <PlanFeaturesCard plan={sub?.plan ?? null} />
          </div>
        </>
      )}

      {activeSection === "settings" && (
        <SettingsSection bot={activeBot} email={email} onLogout={logout} />
      )}
    </AppShell>
  );
}

/* ============================ Sections ============================ */

function OverviewSection({
  bot,
  name,
  stats,
  leads,
  handoffs,
  onGoto,
}: {
  bot?: AdminBot;
  name?: string | null;
  stats?: { leads: number; warmLeads: number; chats: number; unanswered: number; topQuestions: { question: string; count: number }[] };
  leads: AdminLead[];
  handoffs: { id: number; name: string; contact: string; summary: string }[];
  onGoto: (s: SectionKey) => void;
}) {
  const firstName = (name || "").split(" ")[0];
  return (
    <>
      <SectionHeader
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description={bot ? `Here's how ${bot.name} is doing.` : "Here's how your bot is doing."}
      />

      <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
        <StatCard label="Leads" value={stats?.leads ?? "—"} hint="Total captured" accent />
        <StatCard label="Warm leads" value={stats?.warmLeads ?? "—"} hint="Hot + warm" />
        <StatCard label="Total chats" value={stats?.chats ?? "—"} hint="Questions asked" />
        <StatCard label="Unanswered" value={stats?.unanswered ?? "—"} hint="Missing from docs" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top questions */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <b className="text-[14px] font-[750]">Top questions</b>
            <button
              type="button"
              onClick={() => onGoto("knowledge")}
              className="text-[12px] font-[600] text-accent hover:underline"
            >
              Improve docs →
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {(stats?.topQuestions ?? []).length === 0 && (
              <span className="text-[13px] text-muted">No chats yet.</span>
            )}
            {(stats?.topQuestions ?? []).slice(0, 6).map((q, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-[8px] bg-panel px-3 py-2 text-[13px]"
              >
                <span className="truncate text-fg">{q.question}</span>
                <span className="shrink-0 font-mono text-[11px] font-[700] text-faint">
                  ×{q.count}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent leads */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <b className="text-[14px] font-[750]">Recent leads</b>
            <button
              type="button"
              onClick={() => onGoto("leads")}
              className="text-[12px] font-[600] text-accent hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {leads.length === 0 && (
              <span className="text-[13px] text-muted">No leads yet.</span>
            )}
            {leads.slice(0, 5).map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-2 rounded-[8px] bg-panel px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-[600] text-fg">{l.name}</div>
                  <div className="truncate text-[11.5px] text-muted">{l.email}</div>
                </div>
                <ScoreTag score={l.score} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {handoffs.length > 0 && (
        <div className="mt-6">
          <HandoffsCard handoffs={handoffs} />
        </div>
      )}
    </>
  );
}

function HandoffsCard({
  handoffs,
}: {
  handoffs: { id: number; name: string; contact: string; summary: string }[];
}) {
  return (
    <Card>
      <b className="text-[14px] font-[750]">Handoffs for your team</b>
      <p className="mt-0.5 mb-3 text-[12.5px] text-muted">
        When a hot or warm lead comes in, the AI writes a short summary so your team can follow up
        fast.
      </p>
      <div className="flex flex-col gap-2">
        {handoffs.length === 0 && (
          <span className="text-[13px] text-muted">No handoffs yet.</span>
        )}
        {handoffs.map((h) => (
          <div key={h.id} className="rounded-[8px] border border-border bg-panel px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <b className="text-[13px] text-fg">{h.name}</b>
              <span className="font-mono text-[11px] text-faint">{h.contact}</span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-muted">{h.summary}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UnansweredCard({
  stats,
}: {
  stats?: { unanswered: number; topQuestions: { question: string; count: number }[] };
}) {
  return (
    <Card>
      <b className="text-[14px] font-[750]">What to add next</b>
      <p className="mt-0.5 mb-3 text-[12.5px] text-muted">
        {stats && stats.unanswered > 0
          ? `Your bot couldn't answer ${stats.unanswered} question${stats.unanswered === 1 ? "" : "s"} from your docs. The most-asked ones are worth adding.`
          : "Nothing unanswered yet. As visitors ask things your docs don't cover, they'll surface here."}
      </p>
      <div className="flex flex-col gap-1.5">
        {(stats?.topQuestions ?? []).slice(0, 5).map((q, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 rounded-[8px] bg-panel px-3 py-2 text-[13px]"
          >
            <span className="truncate text-fg">{q.question}</span>
            <span className="shrink-0 font-mono text-[11px] font-[700] text-faint">×{q.count}</span>
          </div>
        ))}
        {(stats?.topQuestions ?? []).length === 0 && (
          <span className="text-[13px] text-muted">No questions logged yet.</span>
        )}
      </div>
    </Card>
  );
}

// Plan names + caps mirror the backend's PLAN_LIMITS (db.py) — keep them in sync.
const PLAN_FEATURES: Record<string, string[]> = {
  trial: ["1 bot", "500 messages / month", "Lead capture & CSV export", "Email support"],
  starter: ["1 bot", "2,000 messages / month", "Lead capture & CSV export", "Remove Zeva branding"],
  pro: ["5 bots", "10,000 messages / month", "Priority support", "Remove Zeva branding"],
  business: ["25 bots", "50,000 messages / month", "Priority support", "Custom domains"],
};

function PlanFeaturesCard({ plan }: { plan: string | null }) {
  const key = (plan ?? "trial").toLowerCase();
  const features = PLAN_FEATURES[key] ?? PLAN_FEATURES.trial;
  return (
    <Card>
      <b className="text-[14px] font-[750]">
        What&apos;s included{plan ? ` — ${plan}` : ""}
      </b>
      <ul className="mt-3 flex flex-col gap-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-[13px] text-fg">
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-good/15 text-good">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-2.5 w-2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            {f}
          </li>
        ))}
      </ul>
      <a
        href="mailto:contact@prepvia.com?subject=Upgrade%20my%20Zeva%20plan"
        className="mt-4 inline-block text-[12.5px] font-[600] text-accent hover:underline"
      >
        Compare plans / upgrade →
      </a>
    </Card>
  );
}

function SettingsSection({
  bot,
  email,
  onLogout,
}: {
  bot?: AdminBot;
  email: string;
  onLogout: () => void;
}) {
  return (
    <>
      <SectionHeader title="Settings" description="Your bot's identity, appearance, and account." />

      <div className="flex flex-col gap-6">
        <Card>
          <b className="text-[14px] font-[750]">Bot</b>
          <dl className="mt-3 grid grid-cols-[120px_1fr] gap-y-2.5 text-[13px]">
            <dt className="text-muted">Name</dt>
            <dd className="font-[600] text-fg">{bot?.name ?? "—"}</dd>
            <dt className="text-muted">Bot ID</dt>
            <dd className="font-mono text-[12px] text-fg">{bot?.bot_id ?? "—"}</dd>
            <dt className="text-muted">Accent</dt>
            <dd className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border border-border" style={{ background: bot?.accent }} />
              <span className="font-mono text-[12px] text-fg">{bot?.accent ?? "—"}</span>
            </dd>
          </dl>
          <a
            href={bot ? `/studio?bot=${encodeURIComponent(bot.bot_id)}` : "/studio"}
            className="mt-4 inline-flex items-center gap-1.5 rounded-r1 border border-border bg-panel px-3 py-2 text-[12.5px] font-[650] text-fg hover:border-accent"
          >
            Customize appearance in Studio
            <ExternalLinkIcon className="h-3.5 w-3.5 text-faint" />
          </a>
        </Card>

        <Card>
          <b className="text-[14px] font-[750]">Getting started</b>
          <p className="mt-0.5 mb-3 text-[12.5px] text-muted">
            New here? Replay the quick 30-second dashboard tour anytime.
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("zeva:start-tour"))}
            className="inline-flex items-center gap-1.5 rounded-r1 border border-border bg-panel px-3 py-2 text-[12.5px] font-[650] text-fg hover:border-accent hover:text-accent"
          >
            Take the tour
          </button>
        </Card>

        <Card>
          <b className="text-[14px] font-[750]">Account</b>
          <dl className="mt-3 grid grid-cols-[120px_1fr] gap-y-2.5 text-[13px]">
            <dt className="text-muted">Email</dt>
            <dd className="font-[600] text-fg">{email}</dd>
          </dl>
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 inline-flex items-center gap-1.5 rounded-r1 border border-border bg-surface px-3 py-2 text-[12.5px] font-[650] text-red-500 hover:bg-red-500/10"
          >
            Log out
          </button>
        </Card>
      </div>
    </>
  );
}

/* ============================ Small shared bits ============================ */

const SCORE_STYLE: Record<AdminLead["score"], string> = {
  hot: "bg-red-500/15 text-red-500",
  warm: "bg-amber-500/15 text-amber-600",
  cold: "bg-panel text-faint",
};

function ScoreTag({ score }: { score: AdminLead["score"] }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-[700] uppercase",
        SCORE_STYLE[score] ?? SCORE_STYLE.cold,
      )}
    >
      {score}
    </span>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center bg-bg px-4">{children}</div>;
}

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg">
      <div className="flex items-center gap-2.5 text-muted">
        <span className="h-2.5 w-2.5 animate-blink rounded-full bg-accent" />
        <span className="text-[13px]">Loading your dashboard…</span>
      </div>
    </div>
  );
}

function EmptyCard({
  title,
  body,
  cta,
  secondary,
}: {
  title: string;
  body: React.ReactNode;
  cta?: { href: string; label: string };
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="w-[360px] max-w-full rounded-r3 border border-border bg-surface p-7 text-center shadow-panel">
      <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-r2 bg-gradient-to-br from-accent to-accent-strong text-white shadow-panel">
        <OverviewIcon className="h-5 w-5" />
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
      {secondary && (
        <button
          type="button"
          onClick={secondary.onClick}
          className="mt-3 w-full text-[12.5px] font-[600] text-muted hover:text-fg"
        >
          {secondary.label}
        </button>
      )}
    </div>
  );
}
