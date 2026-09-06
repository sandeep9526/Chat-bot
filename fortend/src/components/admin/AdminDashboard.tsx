"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  useBots,
  useStats,
  useLeads,
  useHandoffs,
  useSubscription,
  useCreateBot,
  useDocs,
  useIngestDoc,
} from "@/hooks/useAdmin";
import { getPendingDesign } from "@/lib/pendingDesign";
import {
  ADMIN_ENABLED,
  type AdminBot,
  type AdminDoc,
  type AdminLead,
  type AdminStats,
  type Handoff,
  executeSubjectErasure,
  exportTenantData,
} from "@/lib/adminApi";
import { useSession, signOut, authClient } from "@/lib/auth-client";
import { submitLead, sendChat } from "@/lib/api";
import { cn } from "@/lib/cn";
import { LEAD_SCORE_STYLE } from "@/lib/leadScore";

import { AppShell, SectionHeader, Card, type NavGroup } from "@/components/panel/AppShell";
import { AccountMenu } from "@/components/panel/AccountMenu";
import { BotSwitcher } from "@/components/panel/BotSwitcher";
import { ThemeToggle } from "@/components/panel/ThemeToggle";
import { LogoLoader } from "@/components/ui/PageLoader";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";
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
import {
  Bot as BotsIcon,
  Check,
  ArrowRight,
  Users,
  Zap,
  Sliders,
  Flame,
  CheckCircle2,
  FlaskConical,
  FileText,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Play,
  Copy,
  Globe,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Eye,
  Send,
  Loader2,
  ShieldCheck,
  Mail,
  HelpCircle,
  Clock,
  X,
} from "lucide-react";

import { StatCard } from "./StatCard";
import { OverviewSection } from "./OverviewSection";
import { LeadsTable } from "./LeadsTable";
import { DocsUpload } from "./DocsUpload";
import { KnowledgeSection } from "./KnowledgeSection";
import { TestChatBox } from "./TestChatBox";
import { BillingCard } from "./BillingCard";
import { SettingsView } from "./SettingsView";
import { HelpSupportView } from "./HelpSupportView";
import { BotsSection } from "./BotsSection";
import { DashboardTour } from "./DashboardTour";
import { SetupChecklist } from "./SetupChecklist";
import { Studio } from "@/components/studio/Studio";
import { LiveHelpdeskCard } from "./LiveHelpdeskCard";
import { LeadFormBuilder } from "./LeadFormBuilder";

/* ============================ Section routing ============================ */

const SECTIONS = [
  "overview",
  "leads",
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
  const [leadsTab, setLeadsTab] = useState<"leads" | "helpdesk" | "builder">("leads");
  const totalLeadsCount = leads?.length ?? 0;
  const hotLeadsCount = leads?.filter((l) => l.score === "hot").length ?? 0;
  const testLeadsCount = leads?.filter((l) => Boolean(l.is_test || l.score === "test" || (l.custom_data && l.custom_data.is_test))).length ?? 0;
  const verifiedLeadsCount = totalLeadsCount - testLeadsCount;

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
          body="We're having trouble reaching your workspace nodes. Verify your connection or refresh to try again."
          secondary={{ label: "Retry Connection", onClick: async () => { await refetchBots(); } }}
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
            href={`mailto:support@ochreshift.in?subject=Bot%20Suspension%20Inquiry%20-%20${activeBot.bot_id}`}
            className="shrink-0 rounded-[8px] bg-red-600 px-3.5 py-2 text-[12.5px] font-[700] text-white shadow-sm hover:bg-red-700 transition"
          >
            Contact Support &rarr;
          </a>
        </div>
      )}

      {activeSection === "bots" && (
        <SetupChecklist
          hasBots={!noBots}
          botId={botId}
          onCreateBot={() => {
            navigate("bots");
            setTimeout(() => window.dispatchEvent(new Event("ochreshift:open-bot-modal")), 10);
          }}
          onGoto={(s) => navigate(s as SectionKey)}
          onOpenStudio={() => navigate("appearance")}
        />
      )}

      {activeSection === "overview" && (
        <OverviewSection
          bot={activeBot}
          bots={bots ?? []}
          onSelectBot={(id) => setSelectedBotId(id)}
          name={name}
          stats={stats}
          leads={leads ?? []}
          handoffs={handoffs ?? []}
          sub={sub}
          hasBots={!noBots}
          onGoto={navigate}
          onCreateBot={() => {
            navigate("bots");
            setTimeout(() => window.dispatchEvent(new Event("ochreshift:open-bot-modal")), 10);
          }}
          onOpenStudio={() => navigate("appearance")}
        />
      )}

      {activeSection === "bots" && (
        <BotsSection
          bots={bots ?? []}
          activeBotId={botId}
          maxBots={sub?.max_bots}
          onSelect={(id) => {
            setSelectedBotId(id);
          }}
          onNavigate={(s) => navigate(s as SectionKey)}
          onBotUpdated={(id) => setSelectedBotId(id)}
          onOpenStudio={(id) => {
            setSelectedBotId(id);
            navigate("appearance");
          }}
          onOpenInstall={(id) => {
            setSelectedBotId(id);
            navigate("install");
          }}
          onTestAgent={(id) => {
            setSelectedBotId(id);
            navigate("playground");
          }}
        />
      )}

      {activeSection === "playground" && (
        <>
          <SectionHeader
            title="Conversations & Playground"
            description="Try your agent before your visitors do, and view previous chat logs."
          />
          {botId && <TestChatBox botId={botId} showLeadTest={true} />}
        </>
      )}

      {activeSection === "leads" && (
        <>
          <SectionHeader
            title="Leads & Live Helpdesk"
            description="Manage visitor contact details, monitor real-time widget sessions, and configure lead capture questions."
          />

          {/* Top KPI Stat Cards (Persistent across all tabs) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11.5px] font-[700] uppercase tracking-wider text-muted block mb-1">
                  Total Contacts
                </span>
                <b className="text-2xl font-[800] text-fg tracking-tight">{totalLeadsCount}</b>
                <span className="text-[12px] text-muted block mt-0.5">
                  {verifiedLeadsCount} visitor{verifiedLeadsCount === 1 ? "" : "s"} · {testLeadsCount} test{testLeadsCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="h-11 w-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11.5px] font-[700] uppercase tracking-wider text-muted block mb-1">
                  Hot Leads
                </span>
                <b className="text-2xl font-[800] text-red-500 tracking-tight">{hotLeadsCount}</b>
                <span className="text-[12px] text-muted block mt-0.5">
                  High purchase intent
                </span>
              </div>
              <div className="h-11 w-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <Flame className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11.5px] font-[700] uppercase tracking-wider text-muted block mb-1">
                  Capture Form
                </span>
                <b className="text-[15px] font-[750] text-fg block tracking-tight">Active & Ready</b>
                <button
                  type="button"
                  onClick={() => setLeadsTab("builder")}
                  className="text-[12px] font-[650] text-accent hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer"
                >
                  <span>Customize fields</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Segmented Sub-navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border/80 pb-3 mb-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setLeadsTab("leads")}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-[700] transition-all cursor-pointer",
                leadsTab === "leads"
                  ? "bg-accent text-white shadow-sm"
                  : "bg-surface hover:bg-panel text-muted hover:text-fg border border-border/70"
              )}
            >
              <Users className="h-4 w-4" />
              <span>Captured Leads</span>
              <span
                className={cn(
                  "ml-0.5 px-2 py-0.5 rounded-full text-[11px] font-[750]",
                  leadsTab === "leads" ? "bg-white/20 text-white" : "bg-panel text-muted"
                )}
              >
                {totalLeadsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLeadsTab("helpdesk")}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-[700] transition-all cursor-pointer",
                leadsTab === "helpdesk"
                  ? "bg-accent text-white shadow-sm"
                  : "bg-surface hover:bg-panel text-muted hover:text-fg border border-border/70"
              )}
            >
              <Zap className="h-4 w-4" />
              <span>Live Helpdesk</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            <button
              type="button"
              onClick={() => setLeadsTab("builder")}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-[700] transition-all cursor-pointer",
                leadsTab === "builder"
                  ? "bg-accent text-white shadow-sm"
                  : "bg-surface hover:bg-panel text-muted hover:text-fg border border-border/70"
              )}
            >
              <Sliders className="h-4 w-4" />
              <span>Form Fields</span>
            </button>
          </div>

          {/* Main Tab Panel with Unified Container System */}
          <div className="w-full">
            {leadsTab === "leads" && (
              <div className="animate-fade-in">
                <LeadsTable leads={leads ?? []} botId={botId} bot={activeBot} onOpenFormBuilder={() => setLeadsTab("builder")} />
              </div>
            )}

            {leadsTab === "helpdesk" && botId && (
              <div className="animate-fade-in">
                <LiveHelpdeskCard botId={botId} />
              </div>
            )}

            {leadsTab === "builder" && botId && (
              <div className="animate-fade-in">
                <LeadFormBuilder botId={botId} />
              </div>
            )}
          </div>

          {/* Team Handoffs (Persistent across all tabs) */}
          <div className="mt-6">
            <HandoffsCard handoffs={handoffs ?? []} />
          </div>
        </>
      )}

      {activeSection === "knowledge" && (
        <KnowledgeSection
          botId={botId}
          stats={stats}
          onNavigateToPlayground={() => navigate("playground")}
        />
      )}

      {activeSection === "appearance" && (
        <div className="w-full">
          <Studio botId={botId} />
        </div>
      )}

      {activeSection === "install" && (
        activeBot && <InstallCard bot={activeBot} />
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
        <BillingCard />
      )}

      {activeSection === "settings" && (
        <SettingsView bot={activeBot} email={email} onLogout={logout} onGoto={navigate} />
      )}

      {activeSection === "help" && (
        <HelpSupportView />
      )}
    </AppShell>

  );
}

/* ============================ Sections & Cards ============================ */

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
              <b className="text-[13px] text-fg">{h.lead_name ?? "Unknown"}</b>
              <span className="font-mono text-[11px] text-faint">{h.lead_email ?? h.lead_phone ?? ""}</span>
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
      <div className="flex flex-col items-center gap-4 text-muted">
        <LogoLoader />
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
  secondary?: { label: string; onClick: () => void | Promise<any> };
}) {
  const [isSecondaryLoading, setSecondaryLoading] = useState(false);

  const handleSecondaryClick = async () => {
    if (!secondary) return;
    setSecondaryLoading(true);
    try {
      await secondary.onClick();
    } finally {
      setSecondaryLoading(false);
    }
  };

  return (
    <div className="w-[360px] max-w-full rounded-r3 border border-border bg-surface p-7 text-center shadow-panel">
      <div className="relative mx-auto mb-6 grid h-20 w-20 place-items-center">
        {/* Subtle pulsing background ring */}
        <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping opacity-20" style={{ animationDuration: '3s' }} />

        {/* Main logo container */}
        <div className="relative z-10 grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-accent/10 to-accent/5 ring-1 ring-accent/20 backdrop-blur-sm">
          <OchreshiftLogo
            variant="mark"
            className="h-10 w-10 opacity-90 transition-transform duration-500 ease-out hover:scale-110 hover:opacity-100"
          />
        </div>
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
          onClick={handleSecondaryClick}
          disabled={isSecondaryLoading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent/10 py-2.5 text-[13.5px] font-[650] text-accent transition-all hover:bg-accent/20 active:scale-[0.98] disabled:opacity-60"
        >
          {isSecondaryLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Retrying...
            </>
          ) : (
            secondary.label
          )}
        </button>
      )}
    </div>
  );
}
