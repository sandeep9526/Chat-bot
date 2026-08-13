"use client";

import { useEffect, useRef, useState } from "react";
import {
  useBots,
  useStats,
  useLeads,
  useHandoffs,
  useSubscription,
  useCreateBot,
} from "@/hooks/useAdmin";
import { getPendingDesign } from "@/lib/pendingDesign";
import {
  ADMIN_ENABLED,
  type AdminBot,
  type AdminLead,
  type AdminStats,
  type Handoff,
  executeSubjectErasure,
  exportTenantData,
} from "@/lib/adminApi";
import { useSession, signOut, authClient } from "@/lib/auth-client";
import { submitLead } from "@/lib/api";
import { cn } from "@/lib/cn";
import { LEAD_SCORE_STYLE } from "@/lib/leadScore";

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
import { Bot as BotsIcon, Check, ArrowRight } from "lucide-react";

import { StatCard } from "./StatCard";
import { LeadsTable } from "./LeadsTable";
import { DocsUpload } from "./DocsUpload";
import { TestChatBox } from "./TestChatBox";
import { BillingCard } from "./BillingCard";
import { BotsSection } from "./BotsSection";
import { DashboardTour } from "./DashboardTour";
import { SetupChecklist } from "./SetupChecklist";
import { Studio } from "@/components/studio/Studio";
import { LiveHelpdeskCard } from "./LiveHelpdeskCard";
import { LeadFormBuilder } from "./LeadFormBuilder";

/* ============================ Section routing ============================ */

const SECTIONS = [
  "overview",
  "bots",
  "playground",
  "knowledge",
  "appearance",
  "install",
  "analytics",
  "billing",
  "settings",
  "help",
] as const;
type SectionKey = (typeof SECTIONS)[number];

const TITLES: Record<SectionKey, string> = {
  overview: "Overview",
  bots: "Agents",
  playground: "Conversations",
  leads: "Leads",
  knowledge: "Knowledge base",
  appearance: "Appearance & Studio",
  install: "Install",
  analytics: "Analytics",
  billing: "Billing & usage",
  settings: "Settings",
  help: "Help & Support",
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
              Set <code className="font-mono text-[12px]">NEXT_PUBLIC_API_URL</code> to your ochreshift
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
          title="Sign in to ochreshift"
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
  const { data: bots, isPending: botsPending, isError: botsError, refetch: refetchBots } = useBots();

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

  if (botsPending) return <Splash />;

  // A failed fetch must not be mistaken for a fresh, bot-less account — that
  // sends the user into the "create your first bot" flow instead of telling
  // them the connection is broken.
  if (botsError) {
    return (
      <Centered>
        <EmptyCard
          title="Couldn't load your agents"
          body="We couldn't reach the ochreshift backend just now. Check your connection and try again."
          secondary={{ label: "Retry", onClick: () => refetchBots() }}
        />
      </Centered>
    );
  }

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
        { key: "bots", label: "Agents", icon: <BotsIcon className="h-[18px] w-[18px]" />, badge: bots?.length ?? undefined, tour: "nav-bots" },
        { key: "knowledge", label: "Knowledge", icon: <KnowledgeIcon className="h-[18px] w-[18px]" />, tour: "nav-knowledge" },
        { key: "playground", label: "Conversations", icon: <PlaygroundIcon className="h-[18px] w-[18px]" /> },
        { key: "leads", label: "Leads", icon: <LeadsIcon className="h-[18px] w-[18px]" />, badge: leadsCount, tour: "nav-leads" },
        { key: "analytics", label: "Analytics", icon: <OverviewIcon className="h-[18px] w-[18px]" /> },
        { key: "appearance", label: "Appearance", icon: <AppearanceIcon className="h-[18px] w-[18px]" />, tour: "nav-appearance" },
        { key: "install", label: "Install", icon: <InstallIcon className="h-[18px] w-[18px]" />, tour: "nav-install" },
      ],
    },
    {
      label: "Account",
      items: [
        { key: "billing", label: "Billing", icon: <BillingIcon className="h-[18px] w-[18px]" /> },
        { key: "settings", label: "Settings", icon: <SettingsIcon className="h-[18px] w-[18px]" /> },
        { key: "help", label: "Help & Support", icon: <KnowledgeIcon className="h-[18px] w-[18px]" /> },
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

      {activeBot?.suspended && (
        <div className="mb-6 flex items-center justify-between rounded-r2 border border-red-500/40 bg-red-500/10 px-5 py-4 text-red-600 dark:text-red-400 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-lg font-[800] text-red-500">
              ⚠️
            </span>
            <div>
              <b className="block text-[14px] font-[750] leading-tight">
                Chatbot Suspended ({activeBot.name})
              </b>
              <p className="mt-0.5 text-[13px] text-red-600/90 dark:text-red-300/90">
                This conversational assistant has been temporarily suspended by platform administration due to usage policy or billing verification. Public chat interactions and webhook responses are disabled.
              </p>
            </div>
          </div>
          <a
            href={`mailto:support@ochreshift.com?subject=Bot%20Suspension%20Inquiry%20-%20${activeBot.bot_id}`}
            className="shrink-0 rounded-[8px] bg-red-600 px-3.5 py-2 text-[12.5px] font-[700] text-white shadow-sm hover:bg-red-700 transition"
          >
            Contact Support &rarr;
          </a>
        </div>
      )}

      {(activeSection === "overview" || activeSection === "bots") && (
        <SetupChecklist
          hasBots={!noBots}
          botId={botId}
          onCreateBot={() => navigate("bots")}
          onGoto={(s) => navigate(s as SectionKey)}
          onOpenStudio={() => navigate("appearance")}
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
          onOpenStudio={(id) => {
            setSelectedBotId(id);
            navigate("appearance");
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
            title="Conversations & Playground"
            description="Try your agent before your visitors do, and view previous chat logs."
          />
          {botId && <TestChatBox botId={botId} />}
        </>
      )}

      {activeSection === "leads" && (
        <>
          <SectionHeader
            title="Leads & Live Helpdesk"
            description="Manage visitor contact details, monitor real-time widget sessions, and take over conversations from AI."
          />
          {botId && (
            <>
              <div className="mb-6">
                <LiveHelpdeskCard botId={botId} />
              </div>
              <div className="mb-6">
                <LeadFormBuilder botId={botId} />
              </div>
            </>
          )}
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
            description="What your agent knows. Add pricing, FAQs, hours, policies — the clearer the text, the better the answers."
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {botId && <DocsUpload botId={botId} />}
            <UnansweredCard stats={stats} />
          </div>
        </>
      )}

      {activeSection === "appearance" && (
        <div className="w-full">
          <Studio botId={botId} />
        </div>
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

      {activeSection === "analytics" && (
        <>
          <SectionHeader
            title="Analytics"
            description="Detailed breakdown of chat volumes, resolutions, and topics."
          />
          <div className="flex items-center justify-center py-20">
             <div className="text-[13px] text-muted flex flex-col items-center">
                 <OverviewIcon className="w-8 h-8 mb-4 text-faint" />
                 <p>Advanced Analytics coming soon in Q4.</p>
             </div>
          </div>
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
        <SettingsSection bot={activeBot} email={email} onLogout={logout} onGoto={navigate} />
      )}
      
      {activeSection === "help" && (
        <>
          <SectionHeader
            title="Help & Support"
            description="Get help with your workspace and agents."
          />
          <div className="flex flex-col gap-4 max-w-[600px]">
             <Card>
                 <b className="text-[14px]">Documentation</b>
                 <p className="text-[12px] text-muted mt-1">Read the guides to set up your agents</p>
                 <button className="mt-4 text-xs font-bold bg-panel px-3 py-1.5 rounded-[6px] border border-border">Read Docs</button>
             </Card>
             <Card>
                 <b className="text-[14px]">Email Support</b>
                 <p className="text-[12px] text-muted mt-1">Need direct assistance?</p>
                 <button className="mt-4 text-xs font-bold bg-panel px-3 py-1.5 rounded-[6px] border border-border">support@ochreshift.com</button>
             </Card>
          </div>
        </>
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
  stats?: AdminStats;
  leads: AdminLead[];
  handoffs: Handoff[];
  onGoto: (s: SectionKey) => void;
}) {
  const firstName = (name || "").split(" ")[0];
  return (
    <>
      <SectionHeader
        title={firstName ? `Welcome back, ${firstName}` : "Overview"}
        description={`${bot ? bot.name : "Your agent"} — leads, documents and status at a glance.`}
        action={
          <>
            <button
              type="button"
              onClick={() => onGoto("appearance")}
              className="rounded-r1 border border-border bg-surface px-3.5 py-2 text-[12.5px] font-[650] text-fg hover:border-accent hover:text-accent"
            >
              Customize appearance
            </button>
            <button
              type="button"
              onClick={() => onGoto("playground")}
              className="rounded-r1 border border-border bg-surface px-3.5 py-2 text-[12.5px] font-[650] text-fg hover:border-accent hover:text-accent"
            >
              Test agent
            </button>
            <button
              type="button"
              onClick={() => onGoto("install")}
              className="rounded-r1 border border-border bg-surface px-3.5 py-2 text-[12.5px] font-[650] text-fg hover:border-accent hover:text-accent"
            >
              Install snippet
            </button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
        <StatCard label="Total Conversations" value={stats?.chats ?? "0"} hint="Processed queries" trend={{ value: "18.6%", isPositive: true }} />
        <StatCard label="Leads Captured" value={stats?.leads ?? "0"} hint="Captured contacts" trend={{ value: "24.7%", isPositive: true }} />
        <StatCard label="Resolution Rate" value="89%" hint="Missing doc info" trend={{ value: "14.3%", isPositive: true }} />
        <StatCard label="Satisfaction" value="4.8 / 5" hint="Satisfaction" trend={{ value: "8.4%", isPositive: true }} />
      </div>

      <div className="mt-6 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <span className="text-[13px] font-[600] text-muted">Conversations</span>
            <span className="text-[11px] font-[650] text-muted rounded-md bg-panel border border-border px-2 py-1">Last 30 days v</span>
          </div>
          <div className="relative h-[200px] w-full flex items-end opacity-80">
            {/* Fake big chart */}
            <svg className="w-full h-full preserveAspectRatio-none" viewBox="0 0 1000 200" fill="none">
              <path d="M0 160 L100 140 L200 170 L300 120 L400 130 L500 80 L600 110 L700 90 L800 130 L900 60 L1000 90" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M0 160 L100 140 L200 170 L300 120 L400 130 L500 80 L600 110 L700 90 L800 130 L900 60 L1000 90 L1000 200 L0 200 Z" fill="url(#chart-fade)" opacity="0.1"/>
              <defs>
                <linearGradient id="chart-fade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)"/>
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="50" x2="1000" y2="50" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="1000" y2="100" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="150" x2="1000" y2="150" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-faint pb-6 pt-2">
              <span>1K</span>
              <span>750</span>
              <span>500</span>
              <span>250</span>
              <span>0</span>
            </div>
            <div className="absolute left-6 bottom-0 w-[calc(100%-24px)] flex justify-between text-[10px] text-faint">
              <span>May 1</span>
              <span>May 8</span>
              <span>May 15</span>
              <span>May 22</span>
              <span>May 29</span>
              <span>Jun 5</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Questions */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <b className="text-[15px] font-[800]">Top Questions</b>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {(stats?.topQuestions ?? []).length === 0 && (
              <span className="py-4 text-center text-[13px] text-muted">No conversation data yet.</span>
            )}
            {(stats?.topQuestions ?? []).slice(0, 5).map((q, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-1 py-1 text-[13px]"
              >
                <span className="truncate font-[500] text-fg">{q.question}</span>
                <span className="shrink-0 text-muted">{q.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Leads */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <b className="text-[15px] font-[800]">Recent Leads</b>
            </div>
            <button
              type="button"
              onClick={() => onGoto("leads")}
              className="inline-flex items-center gap-1 text-[12.5px] font-[600] text-fg hover:underline"
            >
              View all
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {leads.length === 0 && (
              <span className="py-4 text-center text-[13px] text-muted">No leads captured yet.</span>
            )}
            {leads.slice(0, 5).map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 px-1 py-1 text-[13px]"
              >
                <div className="min-w-0 flex-1 grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center">
                  <div className="truncate font-[500] text-fg">{l.name}</div>
                  <div className="truncate text-muted">{l.email}</div>
                  <ScoreTag score={l.score} />
                  <div className="text-muted text-[12px]">2h ago</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Knowledge Base */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <b className="text-[15px] font-[800]">Knowledge Base</b>
            </div>
            <button
              type="button"
              onClick={() => onGoto("knowledge")}
              className="inline-flex items-center gap-1 text-[12.5px] font-[600] text-fg hover:underline"
            >
              Manage
            </button>
          </div>
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded bg-panel border border-border text-faint">
                   <KnowledgeIcon className="h-4 w-4" />
                </span>
                <div className="text-[13.5px] font-[500]">Website</div>
             </div>
             <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded bg-panel border border-border text-faint">
                   <KnowledgeIcon className="h-4 w-4" />
                </span>
                <div className="text-[13.5px] font-[500]">Pricing Guide.pdf</div>
             </div>
             <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded bg-panel border border-border text-faint">
                   <KnowledgeIcon className="h-4 w-4" />
                </span>
                <div className="text-[13.5px] font-[500]">FAQ</div>
             </div>
          </div>
        </Card>

        {/* Your Agents */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <b className="text-[15px] font-[800]">Your Agents</b>
            </div>
            <button
              type="button"
              onClick={() => onGoto("bots")}
              className="inline-flex items-center gap-1 text-[12.5px] font-[600] text-fg hover:underline"
            >
              View all
            </button>
          </div>
          <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-white font-bold text-xs">AS</span>
                   <div className="text-[13.5px] font-[500]">Acme Support Agent</div>
                </div>
                <span className="text-[11px] font-medium bg-good/10 text-good px-2 py-0.5 rounded-full">Active</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <span className="grid h-8 w-8 place-items-center rounded-full bg-panel border border-border text-muted font-bold text-xs">SA</span>
                   <div className="text-[13.5px] font-[500]">Sales Assistant</div>
                </div>
                <span className="text-[11px] font-medium bg-panel border border-border text-muted px-2 py-0.5 rounded-full">Draft</span>
             </div>
          </div>
        </Card>
      </div>

      {/* Removed old handoffs card render from overview */}
    </>
  );
}

function HandoffsCard({
  handoffs,
}: {
  handoffs: Handoff[];
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
          <div key={h.id} className="rounded-r1 border border-border bg-panel px-3 py-2.5">
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
  stats?: AdminStats;
}) {
  return (
    <Card>
      <b className="text-[14px] font-[750]">What to add next</b>
      <p className="mt-0.5 mb-3 text-[12.5px] text-muted">
        {stats && stats.unanswered > 0
          ? `Your agent couldn't answer ${stats.unanswered} question${stats.unanswered === 1 ? "" : "s"} from your docs. The most-asked ones are worth adding.`
          : "Nothing unanswered yet. As visitors ask things your docs don't cover, they'll surface here."}
      </p>
      <div className="flex flex-col gap-1.5">
        {(stats?.topQuestions ?? []).slice(0, 5).map((q, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 rounded-r1 bg-panel px-3 py-2 text-[13px]"
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
  trial: ["1 agent", "500 messages / month", "Lead capture & CSV export", "Email support"],
  starter: ["1 agent", "2,000 messages / month", "Lead capture & CSV export", "Remove ochreshift branding"],
  pro: ["5 agents", "10,000 messages / month", "Priority support", "Remove ochreshift branding"],
  business: ["25 agents", "50,000 messages / month", "Priority support", "Custom domains"],
  enterprise: ["100 agents", "250,000 messages / month", "Dedicated support", "Custom domains & caps"],
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
              <Check strokeWidth={3} className="h-2.5 w-2.5" />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <a
        href="mailto:support@ochreshift.com?subject=Upgrade%20my%20ochreshift%20plan"
        className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-[600] text-accent hover:underline"
      >
        Compare plans / upgrade <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </Card>
  );
}

function SettingsSection({
  bot,
  email,
  onLogout,
  onGoto,
}: {
  bot?: AdminBot;
  email: string;
  onLogout: () => void;
  onGoto?: (s: SectionKey) => void;
}) {
  const updateBot = useCreateBot();
  const [notifEmail, setNotifEmail] = useState(bot?.notification_email ?? "");
  const [webhook, setWebhook] = useState(bot?.webhook_url ?? "");
  const [googleSheets, setGoogleSheets] = useState(bot?.google_sheets_url ?? "");
  const [whatsappId, setWhatsappId] = useState(bot?.whatsapp_phone_number_id ?? "");
  const [modelOverride, setModelOverride] = useState(bot?.model_override ?? "");
  const [customPromptStyle, setCustomPromptStyle] = useState(bot?.custom_prompt_style ?? "");
  const [domains, setDomains] = useState((bot?.allowed_domains ?? ["*"]).join(", "));
  const [integrationMsg, setIntegrationMsg] = useState("");
  const [testAlertMsg, setTestAlertMsg] = useState("");
  const [testingAlert, setTestingAlert] = useState(false);
  const [showGSheetsModal, setShowGSheetsModal] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [erasureIdentifier, setErasureIdentifier] = useState("");
  const [erasureLoading, setErasureLoading] = useState(false);
  const [erasureMsg, setErasureMsg] = useState("");

  const gSheetsTemplateCode = `/**
 * ochreshift AI - Real-Time Lead Capture Sync
 * Paste this script into Extensions > Apps Script and deploy as Web App (Access: Anyone)
 */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Lead ID", "Date", "Name", "Email", "Phone", "Score", "Message", "AI Summary"]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff");
    }
    
    var timestamp = new Date().toLocaleString();
    sheet.appendRow([
      data.leadId || "—",
      timestamp,
      data.name || "—",
      data.email || "—",
      data.phone || "—",
      (data.score || "cold").toUpperCase(),
      data.message || "—",
      data.summary || "—"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passError, setPassError] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (bot) {
      setNotifEmail(bot.notification_email ?? "");
      setWebhook(bot.webhook_url ?? "");
      setGoogleSheets(bot.google_sheets_url ?? "");
      setWhatsappId(bot.whatsapp_phone_number_id ?? "");
      setModelOverride(bot.model_override ?? "");
      setCustomPromptStyle(bot.custom_prompt_style ?? "");
      setDomains((bot.allowed_domains ?? ["*"]).join(", "));
    }
  }, [bot]);

  const handleSaveIntegrations = async () => {
    if (!bot) return;
    setIntegrationMsg("Saving...");
    try {
      await updateBot.mutateAsync({
        botId: bot.bot_id,
        name: bot.name,
        accent: bot.accent,
        welcome: bot.welcome,
        suggestions: bot.suggestions,
        allowedDomains: domains.split(",").map((d) => d.trim()).filter(Boolean),
        notificationEmail: notifEmail.trim() || undefined,
        webhookUrl: webhook.trim() || undefined,
        googleSheetsUrl: googleSheets.trim() || undefined,
        whatsappPhoneNumberId: whatsappId.trim() || undefined,
        modelOverride: modelOverride.trim() || undefined,
        customPromptStyle: customPromptStyle.trim() || undefined,
      });
      setIntegrationMsg("✅ Settings and custom AI rules saved successfully!");
      setTimeout(() => setIntegrationMsg(""), 4000);
    } catch (e: any) {
      setIntegrationMsg("❌ Failed to save settings: " + (e?.message || "Unknown error"));
    }
  };

  const handleSendTestAlert = async () => {
    if (!bot) return;
    setTestingAlert(true);
    setTestAlertMsg("");
    try {
      const res = await submitLead({
        name: "ochreshift Test Lead",
        email: "test.lead@ochreshift-demo.com",
        phone: "+1-555-0199",
        botId: bot.bot_id,
      });
      if (res.ok) {
        setTestAlertMsg("✅ Test lead alert emitted! Check your configured email, webhook, and spreadsheets.");
      } else {
        setTestAlertMsg("❌ Test alert request failed to record lead.");
      }
    } catch (e: any) {
      setTestAlertMsg("❌ Could not reach backend engine: " + (e?.message || "Error"));
    } finally {
      setTestingAlert(false);
      setTimeout(() => setTestAlertMsg(""), 6000);
    }
  };

  const handleExportData = async () => {
    try {
      setExportingData(true);
      const bundle = await exportTenantData();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ochreshift_gdpr_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("❌ Export failed: " + (e?.message || "Unknown error"));
    } finally {
      setExportingData(false);
    }
  };

  const handleErasureRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!erasureIdentifier.trim()) return;
    try {
      setErasureLoading(true);
      setErasureMsg("");
      const res = await executeSubjectErasure(erasureIdentifier.trim());
      setErasureMsg(`✅ GDPR Erasure Complete: Purged ${res.purged?.leads ?? 0} matching lead(s) and ${res.purged?.chats ?? 0} chat history record(s).`);
      setErasureIdentifier("");
    } catch (err: any) {
      setErasureMsg("❌ Erasure Failed: " + (err?.message || "Server error"));
    } finally {
      setErasureLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg("");
    setPassError("");
    if (!currPassword || !newPassword) {
      setPassError("Both fields are required.");
      return;
    }
    setChangingPass(true);
    try {
      const res: any = authClient.changePassword
        ? await authClient.changePassword({
            currentPassword: currPassword,
            newPassword: newPassword,
            revokeOtherSessions: true,
          })
        : { error: { message: "Password management is managed via Better Auth server." } };
      if (res?.error) {
        setPassError(res.error.message || "Failed to update password.");
      } else {
        setPassMsg("✅ Password updated successfully! All other sessions revoked.");
        setCurrPassword("");
        setNewPassword("");
      }
    } catch (err: any) {
      setPassError("Error while updating password.");
    } finally {
      setChangingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toUpperCase() !== "DELETE") {
      setDeleteError("Please type DELETE to confirm.");
      return;
    }
    setDeletingAccount(true);
    setDeleteError("");
    try {
      if ((authClient as any).deleteUser) {
        await (authClient as any).deleteUser({ callbackURL: "/" });
      } else {
        await signOut();
        window.location.href = "/";
      }
    } catch (err: any) {
      setDeleteError("Failed to purge account: " + (err?.message || "Unknown error"));
      setDeletingAccount(false);
    }
  };

  return (
    <>
      <SectionHeader title="Settings" description="Your agent's identity, appearance, integrations, and account security." />

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
          <button
            type="button"
            onClick={() => onGoto ? onGoto("appearance") : (window.location.hash = "appearance")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-r1 border border-border bg-panel px-3 py-2 text-[12.5px] font-[650] text-fg hover:border-accent cursor-pointer"
          >
            Customize appearance in Studio
            <ExternalLinkIcon className="h-3.5 w-3.5 text-faint" />
          </button>
        </Card>

        <Card>
          <b className="text-[14px] font-[750]">AI Inference & LLM Engine Selection</b>
          <p className="mt-1 text-[12.5px] text-muted">
            Select the primary Large Language Model engine powering your agent's conversational intelligence and RAG answers.
          </p>
          <div className="mt-4 max-w-md">
            <label className="mb-1.5 block text-[12.5px] font-[600] text-fg">Preferred Inference Model</label>
            <select
              value={modelOverride}
              onChange={(e) => setModelOverride(e.target.value)}
              className="w-full rounded-r1 border border-border bg-panel px-3 py-2 text-[12.5px] font-[600] text-fg outline-none focus:border-accent cursor-pointer"
            >
              <option value="">⚡ Automatic (ochreshift Intelligent Multi-Model Failover Chain - Default)</option>
              <option value="meta-llama/llama-3.3-70b-instruct:free">🦙 LLaMA 3.3 70B Instruct (High Precision & Reasoning)</option>
              <option value="google/gemini-2.0-flash-lite-preview-02-05:free">✨ Gemini 2.0 Flash Lite (Ultra-Fast Ultra-Low Latency)</option>
              <option value="mistralai/mistral-nemo:free">🌀 Mistral Nemo 12B (Optimal Multilingual Support)</option>
              <option value="qwen/qwen-2.5-coder-32b-instruct">🧠 Qwen 2.5 32B Instruct (Deep Logic & Code RAG)</option>
            </select>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveIntegrations}
              disabled={updateBot.isPending || !bot}
              className="cursor-pointer rounded-r1 bg-accent px-3.5 py-1.5 text-[12.5px] font-[650] text-white transition hover:brightness-110 disabled:opacity-50"
            >
              Save Model Preference
            </button>
          </div>
        </Card>

        <Card>
          <b className="text-[14px] font-[750]">Custom System Instructions & Behavioral Rules</b>
          <p className="mt-1 text-[12.5px] text-muted leading-relaxed">
            Define personality rules, formatting preferences, or strict guardrail constraints for your ochreshift agent (e.g., <i>&quot;Never mention competitor pricing&quot;</i>, <i>&quot;Always ask if the user prefers a live phone call&quot;</i>). These guidelines are securely applied alongside verified RAG context.
          </p>
          <div className="mt-4 max-w-xl">
            <label className="mb-1.5 block text-[12.5px] font-[600] text-fg">AI System Directives & Constraints</label>
            <textarea
              rows={4}
              value={customPromptStyle}
              onChange={(e) => setCustomPromptStyle(e.target.value)}
              placeholder="e.g., Speak in a professional, empathetic tone. Keep responses under 3 paragraphs. Never disclose employee internal names."
              className="w-full rounded-r1 border border-border bg-panel px-3.5 py-2.5 text-[13px] font-[500] text-fg leading-relaxed outline-none transition focus:border-accent placeholder:text-faint"
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveIntegrations}
              disabled={updateBot.isPending || !bot}
              className="cursor-pointer rounded-r1 bg-accent px-3.5 py-1.5 text-[12.5px] font-[650] text-white transition hover:brightness-110 disabled:opacity-50"
            >
              Save Custom Rules
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <b className="text-[14px] font-[750]">Integrations, Webhooks & Domain Security</b>
              <p className="mt-0.5 text-[12.5px] text-muted">
                Connect live lead alert notifications and lock widget rendering to trusted domains.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSendTestAlert}
              disabled={testingAlert || !bot}
              className="cursor-pointer rounded-r1 border border-border bg-surface px-3 py-1.5 text-[12px] font-[600] text-fg transition hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {testingAlert ? "Sending..." : "⚡ Send Test Alert"}
            </button>
          </div>

          {testAlertMsg && (
            <div className="mt-3 rounded-r1 border border-border bg-panel p-2.5 text-[12.5px] text-fg">
              {testAlertMsg}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-4 text-[13px]">
            <div>
              <label className="mb-1 block font-[600] text-fg">Lead Alert Notification Email</label>
              <input
                type="email"
                value={notifEmail}
                onChange={(e) => setNotifEmail(e.target.value)}
                placeholder="sales@mycompany.com (For Hot/Warm lead alerts)"
                className="w-full rounded-r1 border border-border bg-panel px-3 py-2 font-mono text-[12px] text-fg outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="mb-1 block font-[600] text-fg">Custom Webhook URL (CRM / Zapier / Make)</label>
              <input
                type="url"
                value={webhook}
                onChange={(e) => setWebhook(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className="w-full rounded-r1 border border-border bg-panel px-3 py-2 font-mono text-[12px] text-fg outline-none focus:border-accent"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="font-[600] text-fg">Google Sheets Webhook URL</label>
                <button
                  type="button"
                  onClick={() => setShowGSheetsModal(true)}
                  className="cursor-pointer font-[650] text-accent text-[12px] hover:underline"
                >
                  📋 View Apps Script Setup Template &amp; Guide
                </button>
              </div>
              <input
                type="url"
                value={googleSheets}
                onChange={(e) => setGoogleSheets(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full rounded-r1 border border-border bg-panel px-3 py-2 font-mono text-[12px] text-fg outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="mb-1 block font-[600] text-fg">WhatsApp Phone Number ID</label>
              <input
                type="text"
                value={whatsappId}
                onChange={(e) => setWhatsappId(e.target.value)}
                placeholder="e.g. 104593849182310 (For automated WhatsApp message dispatch)"
                className="w-full rounded-r1 border border-border bg-panel px-3 py-2 font-mono text-[12px] text-fg outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="mb-1 block font-[600] text-fg">Allowed Widget Domains (CORS Security)</label>
              <p className="mb-1 text-[11.5px] text-muted">Comma-separated domains where widget can embed. Use * to allow all.</p>
              <input
                type="text"
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                placeholder="example.com, mycompany.io, *"
                className="w-full rounded-r1 border border-border bg-panel px-3 py-2 font-mono text-[12px] text-fg outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveIntegrations}
              disabled={updateBot.isPending || !bot}
              className="cursor-pointer rounded-r1 bg-accent px-4 py-2 text-[13px] font-[650] text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {updateBot.isPending ? "Saving..." : "Save Integrations"}
            </button>
            {integrationMsg && <span className="text-[12.5px] text-fg font-[500]">{integrationMsg}</span>}
          </div>
        </Card>

        <Card>
          <b className="text-[14px] font-[750]">Getting started</b>
          <p className="mt-0.5 mb-3 text-[12.5px] text-muted">
            New here? Replay the quick 30-second dashboard tour anytime.
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("zeva:start-tour"))}
            className="inline-flex items-center gap-1.5 rounded-r1 border border-border bg-panel px-3 py-2 text-[12.5px] font-[650] text-fg hover:border-accent hover:text-accent cursor-pointer"
          >
            Take the tour
          </button>
        </Card>

        <Card>
          <b className="text-[14px] font-[750]">Account & Security</b>
          <dl className="mt-3 grid grid-cols-[120px_1fr] gap-y-2.5 text-[13px]">
            <dt className="text-muted">Email</dt>
            <dd className="font-[600] text-fg">{email}</dd>
          </dl>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(!showPasswordModal);
                setShowDeleteModal(false);
              }}
              className="cursor-pointer rounded-r1 border border-border bg-panel px-3 py-2 text-[12.5px] font-[650] text-fg transition hover:border-accent hover:text-accent"
            >
              {showPasswordModal ? "Close Password Settings" : "Change Password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(!showDeleteModal);
                setShowPasswordModal(false);
              }}
              className="cursor-pointer rounded-r1 border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] font-[650] text-red-500 transition hover:bg-red-500/20"
            >
              {showDeleteModal ? "Cancel Deletion" : "Delete Account"}
            </button>
            <button
              type="button"
              onClick={handleExportData}
              disabled={exportingData}
              className="cursor-pointer rounded-r1 border border-border bg-panel px-3 py-2 text-[12.5px] font-[650] text-fg transition hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {exportingData ? "📦 Exporting Archive..." : "📦 Export Account & Customer Data"}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="cursor-pointer rounded-r1 border border-border bg-surface px-3 py-2 text-[12.5px] font-[650] text-bad transition hover:bg-bad/10 ml-auto"
            >
              Log out
            </button>
          </div>

          {showPasswordModal && (
            <form onSubmit={handleChangePassword} className="mt-4 rounded-r1 border border-border bg-panel p-4 text-[13px]">
              <b className="block font-[700] text-fg">Update Password</b>
              <p className="mt-0.5 mb-3 text-[12px] text-muted">Updating your password will automatically revoke all active sessions across devices.</p>
              <div className="flex flex-col gap-3 max-w-sm">
                <div>
                  <label className="mb-1 block text-muted font-[500]">Current Password</label>
                  <input
                    type="password"
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    required
                    className="w-full rounded-r1 border border-border bg-surface px-3 py-1.5 text-fg outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-muted font-[500]">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full rounded-r1 border border-border bg-surface px-3 py-1.5 text-fg outline-none focus:border-accent"
                  />
                </div>
                {passError && <p className="text-red-500 font-[500] text-[12px]">{passError}</p>}
                {passMsg && <p className="text-good font-[500] text-[12px]">{passMsg}</p>}
                <button
                  type="submit"
                  disabled={changingPass}
                  className="mt-1 cursor-pointer w-fit rounded-r1 bg-accent px-4 py-2 font-[650] text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {changingPass ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          )}

          {showDeleteModal && (
            <div className="mt-4 rounded-r1 border border-red-500/40 bg-red-500/5 p-4 text-[13px]">
              <b className="block font-[700] text-red-500">Danger Zone: Account Deletion</b>
              <p className="mt-1 mb-3 text-[12.5px] text-muted">
                Permanently deletes your user account, subscription tier, and all associated agents and leads. This operation is irreversible under GDPR data purge policies.
              </p>
              <div>
                <label className="mb-1 block font-[600] text-fg">Type <span className="font-mono font-[750] text-red-500">DELETE</span> to confirm:</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full max-w-xs rounded-r1 border border-border bg-panel px-3 py-1.5 font-mono text-fg outline-none focus:border-red-500"
                />
              </div>
              {deleteError && <p className="mt-2 text-red-500 font-[500] text-[12px]">{deleteError}</p>}
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="mt-3 cursor-pointer rounded-r1 bg-red-600 px-4 py-2 font-[650] text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletingAccount ? "Purging Account..." : "Permanently Purge Account"}
              </button>
            </div>
          )}
        </Card>

        <Card>
          <b className="text-[14px] font-[750]">🛡️ GDPR & Data Privacy Governance (Subject Erasure)</b>
          <p className="mt-0.5 mb-3 text-[12.5px] text-muted">
            Execute Article 17 "Right to be Forgotten" requests. Enter a customer&apos;s email address, phone number, or exact name to permanently scrub their leads and chat conversation traces across your ochreshift agents.
          </p>
          <form onSubmit={handleErasureRequest} className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              value={erasureIdentifier}
              onChange={(e) => setErasureIdentifier(e.target.value)}
              placeholder="e.g. client@domain.com or +1-555-0199"
              className="flex-1 rounded-r1 border border-border bg-panel px-3 py-2 font-mono text-[12.5px] text-fg outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={erasureLoading || !erasureIdentifier.trim()}
              className="cursor-pointer whitespace-nowrap rounded-r1 bg-red-500/20 border border-red-500/40 px-4 py-2 text-[12.5px] font-[650] text-red-500 transition hover:bg-red-500/30 disabled:opacity-50"
            >
              {erasureLoading ? "Purging Traces..." : "⚡ Execute Right-to-be-Forgotten Purge"}
            </button>
          </form>
          {erasureMsg && (
            <div className="mt-3 rounded-r1 border border-border bg-panel p-2.5 text-[12.5px] font-[500] text-fg">
              {erasureMsg}
            </div>
          )}
        </Card>
      </div>

      {showGSheetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-r2 border border-border bg-panel p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-[16px] font-[750] text-fg">📊 ochreshift Real-Time Google Sheets Lead Sync Setup</h3>
              <button
                type="button"
                onClick={() => setShowGSheetsModal(false)}
                className="rounded-r1 bg-canvas px-2.5 py-1 text-[12px] font-[650] text-muted hover:text-fg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="mt-4 space-y-4 text-[13px] text-fg">
              <div className="rounded-r1 bg-canvas p-3.5 border border-border">
                <p className="font-[700] text-accent">Step-by-Step Setup Guide:</p>
                <ol className="mt-2.5 ml-5 list-decimal space-y-1.5 text-[12.5px] text-muted leading-relaxed">
                  <li>Open your existing Google Sheet (or create a brand new one) and navigate to <b>Extensions &gt; Apps Script</b> in the top menu.</li>
                  <li>Delete any default code in the editor and <b>paste the automated ochreshift Lead Sync template</b> provided below.</li>
                  <li>Click <b>Deploy &gt; New deployment</b>, select the deployment type as <b>Web app</b>.</li>
                  <li>Under configuration, set <i>Execute as</i> to <b>Me</b> and set <i>Who has access</i> to <b>Anyone</b>.</li>
                  <li>Click <b>Deploy</b>, authorize prompts if asked, copy the resulting <b>Web App URL</b>, and paste it directly into your dashboard integration field!</li>
                </ol>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-[750] uppercase tracking-wider text-muted">Google Apps Script Webhook Code (.gs)</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(gSheetsTemplateCode);
                      alert("✅ Apps Script template copied to clipboard!");
                    }}
                    className="cursor-pointer rounded bg-accent px-2.5 py-1 text-[11px] font-[700] text-white transition hover:brightness-110"
                  >
                    📋 Copy Script Code
                  </button>
                </div>
                <pre className="max-h-64 overflow-x-auto rounded-r1 border border-border bg-zinc-950 p-4 font-mono text-[11.5px] leading-relaxed text-emerald-400">
                  {gSheetsTemplateCode}
                </pre>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGSheetsModal(false)}
                className="cursor-pointer rounded-r1 bg-accent px-5 py-2 text-[13px] font-[650] text-white hover:brightness-110"
              >
                Done &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================ Small shared bits ============================ */

function ScoreTag({ score }: { score: AdminLead["score"] }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-[700] uppercase",
        LEAD_SCORE_STYLE[score] ?? LEAD_SCORE_STYLE.cold,
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
