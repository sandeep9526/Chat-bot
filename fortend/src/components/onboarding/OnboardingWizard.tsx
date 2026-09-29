"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Check, ChevronRight, X, Bot, Globe, CornerRightDown, Zap, User, FileText, Palette, LogOut, Terminal, Edit2, Save, Image as ImageIcon, MessageSquare, Copy, CheckCircle2 } from "lucide-react";
import { createBot, generateBotQuestions, type AdminBot } from "@/lib/adminApi";
import { useOchreshiftStore } from "@/stores/ochreshiftStore";
import { stashBotDesign } from "@/lib/pendingDesign";
import { useDocs } from "@/hooks/useAdmin";
import { DEFAULTS } from "@/lib/defaults";
import { DocsUpload } from "@/components/admin/DocsUpload";
import { TestChatBox } from "@/components/admin/TestChatBox";
import { OchreshiftWidget } from "@/components/widget/OchreshiftWidget";
import { cn } from "@/lib/cn";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";
import { ThemeToggle } from "@/components/panel/ThemeToggle";
import { Studio } from "@/components/studio/Studio";
import {
  PLATFORMS,
  WHERE_TO_PASTE,
  FILE_LABEL,
  highlightSnippet,
  SNIPPET_BUILDERS,
  type PlatformKey,
} from "@/components/panel/InstallCard";
import { useSession, authClient } from "@/lib/auth-client";
import { markSetupDone } from "@/lib/setupProgress";
import { decodeHtmlEntities, sanitizeBrandName, sanitizeWelcomeMessage, sanitizeSuggestions } from "@/lib/sanitize";

export interface OnboardingWizardProps {
  onClose?: () => void;
  onSaved?: (botId: string) => void;
}

type Step = "intro" | "profile" | "knowledge" | "appearance" | "install";

export function OnboardingWizard({ onClose, onSaved }: OnboardingWizardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("intro");
  const [isProcessing, setIsProcessing] = useState(false);
  const [botId, setBotId] = useState<string | null>(null);

  // Verification states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const widgetContainerRef = useRef<HTMLDivElement>(null);

  // Track uploaded documents to gate the Generate button
  const { data: docs = [] } = useDocs(botId || "");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [error, setError] = useState("");
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    setIsDarkTheme(document.documentElement.getAttribute("data-theme") === "dark");
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "data-theme") {
          setIsDarkTheme(document.documentElement.getAttribute("data-theme") === "dark");
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const stepsList = [
    { id: "intro", title: "Business", subtitle: "Step 1", icon: Globe },
    { id: "profile", title: "Profile", subtitle: "Step 2", icon: User },
    { id: "knowledge", title: "Knowledge", subtitle: "Step 3", icon: FileText },
    { id: "appearance", title: "Appearance", subtitle: "Step 4", icon: Palette },
    { id: "install", title: "Install", subtitle: "Step 5", icon: Terminal }
  ];
  const currentStepIndex = stepsList.findIndex(s => s.id === step);

  // Draft state
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [name, setName] = useState("");
  const [welcome, setWelcome] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [accent, setAccent] = useState(DEFAULTS.accent);

  const [platform, setPlatform] = useState<PlatformKey>("html");
  const [copied, setCopied] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!showGreeting || !confettiCanvasRef.current) return;
    const canvas = confettiCanvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = ["#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#ef4444", "#811831"];
    const particles = Array.from({ length: 90 }, () => ({
      x: canvas.width * 0.5 + (Math.random() - 0.5) * 350,
      y: canvas.height * 0.35 + (Math.random() - 0.5) * 150,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 10 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      opacity: 1,
    }));

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.rotation += p.vRot;
        p.opacity -= 0.007;
        if (p.opacity > 0 && p.y < canvas.height) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }
      if (alive) animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [showGreeting]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [canFrame, setCanFrame] = useState<boolean | null>(null);

  useEffect(() => {
    if (!websiteUrl) return;
    let mounted = true;
    fetch(`/api/check-frame?url=${encodeURIComponent(websiteUrl)}`)
      .then(res => res.json())
      .then(data => {
        if (mounted) setCanFrame(data.canFrame);
      })
      .catch(() => {
        if (mounted) setCanFrame(false);
      });
    return () => { mounted = false; };
  }, [websiteUrl]);

  // We create the bot at the end of Step 2, then reuse it.
  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ochreshift-onboarding-draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.websiteUrl) setWebsiteUrl(draft.websiteUrl);
        if (draft.name) setName(draft.name);
        if (draft.welcome) setWelcome(draft.welcome);
        if (draft.suggestions) setSuggestions(draft.suggestions);
        if (draft.accent) setAccent(draft.accent);
        if (draft.botId) setBotId(draft.botId);
        if (draft.step) setStep(draft.step);

        // Restore full appearance config if available
        if (draft.config) {
          useOchreshiftStore.getState().applyConfig(draft.config, draft.websiteUrl);
        }
      }
    } catch { }
    setIsLoaded(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (!isLoaded) return;

    // Helper to persist everything
    const persistData = (currentConfig: any) => {
      localStorage.setItem(
        "ochreshift-onboarding-draft",
        JSON.stringify({
          websiteUrl,
          name,
          welcome,
          suggestions,
          accent,
          botId,
          step,
          config: currentConfig
        })
      );
    };

    // Save initially with current config
    persistData(useOchreshiftStore.getState().config);

    // Subscribe to store changes to continuously persist appearance tweaks
    const unsub = useOchreshiftStore.subscribe((state) => {
      persistData(state.config);
    });

    return () => unsub();
  }, [websiteUrl, name, welcome, suggestions, accent, botId, step, isLoaded]);

  const onSavedRef = useRef(onSaved);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onSavedRef.current = onSaved;
    onCloseRef.current = onClose;
  }, [onSaved, onClose]);

  const handleFetchWebsite = async () => {
    if (!websiteUrl.trim()) return;
    setIsProcessing(true);
    setError("");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/demo/ingest-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl.trim() }),
      });
      if (!res.ok) throw new Error("Failed to fetch website details");
      const data = await res.json();

      let extractedName = "";
      if (data.name) {
        extractedName = sanitizeBrandName(data.name);
        if (extractedName) setName(extractedName);
      }

      if (data.welcome) {
        const cleanWelcome = sanitizeWelcomeMessage(data.welcome, extractedName);
        setWelcome(cleanWelcome);
      } else if (extractedName) {
        setWelcome(`Hi! Welcome to ${extractedName}. How can I assist you today?`);
      }

      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(sanitizeSuggestions(data.suggestions, extractedName));
      }
      
      setStep("profile");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToAppearance = () => {
    const assistantName = (name || store.config.name || "Assistant").trim();
    store.setBotId(botId || "");
    store.setName(assistantName);
    store.setLabel(`Ask ${assistantName}`);
    store.setWelcome(welcome);
    store.setSuggestions(suggestions);
    store.setAccent(accent);
    if (websiteUrl) {
      store.setWebsiteUrl(websiteUrl);
    }
    setStep("appearance");
  };


  const store = useOchreshiftStore();

  useEffect(() => {
    if (step === "appearance" && isLoaded) {
      const assistantName = (name || store.config.name || "Assistant").trim();
      store.setOpen(true);
      store.setBotId(botId || "");
      store.applyConfig({
        glass: false,
        name: assistantName,
        label: `Ask ${assistantName}`,
      });
      store.setName(assistantName);
      store.setLabel(`Ask ${assistantName}`);
      if (welcome) store.setWelcome(welcome);
      if (suggestions && suggestions.length > 0) store.setSuggestions(suggestions);
      if (accent) store.setAccent(accent);
      if (websiteUrl) store.setWebsiteUrl(websiteUrl);
    }
  }, [step, isLoaded]);


  const handleSaveAppearanceAndContinue = async () => {
    setIsProcessing(true);
    setError("");
    try {
      if (botId) {
        await createBot({
          botId,
          name: store.config.name,
          accent: store.config.accent,
          welcome: store.config.welcome,
          suggestions: store.config.suggestions.filter(s => s.trim()),
          design: { config: store.config, websiteUrl: store.websiteUrl },
        });
        stashBotDesign(botId, store.config, store.websiteUrl);
        markSetupDone(botId, "customize");
      }
      setStep("install");
    } catch (err: any) {
      setError(err.message || "Failed to save appearance");
    } finally {
      setIsProcessing(false);
    }
  };


  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage("");
    try {
      await authClient.sendVerificationEmail({
        email: session?.user?.email || "",
        callbackURL: window.location.href,
      });
      setResendMessage("Link sent! Please check your inbox.");
    } catch (e: any) {
      setResendMessage(e.message || "Failed to resend");
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || newEmail === session?.user?.email) {
      setIsEditingEmail(false);
      return;
    }
    setIsResending(true);
    setResendMessage("");
    try {
      // Better Auth updateUser function
      await authClient.updateUser({
        email: newEmail.trim(),
      } as any);
      // After updating, send verification to new email
      await authClient.sendVerificationEmail({
        email: newEmail.trim(),
        callbackURL: window.location.href,
      });
      setResendMessage("Email updated and link sent!");
      setIsEditingEmail(false);

      // Need to force a reload to get new session data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      setResendMessage(e.message || "Failed to update email");
    } finally {
      setIsResending(false);
    }
  };

  const handleCreateBot = async () => {
    if (!name.trim()) return;

    if (session?.user && !session.user.emailVerified) {
      try {
        const fresh = await authClient.getSession();
        if (!fresh?.data?.user?.emailVerified) {
          setShowVerificationModal(true);
          return;
        }
      } catch {
        setShowVerificationModal(true);
        return;
      }
    }

    setIsProcessing(true);
    setError("");
    try {
      if (!botId) {
        const res = await createBot({
          name: name.trim(),
          welcome: welcome.trim(),
          suggestions,
          accent,
        });
        setBotId(res.botId);
      }
      setStep("knowledge");
    } catch (err: any) {
      setError(err.message || "Could not create agent");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!botId) return;
    setIsProcessing(true);
    setError("");
    try {
      const generated = await generateBotQuestions(botId);
      if (generated && generated.length > 0) {
        setSuggestions(sanitizeSuggestions(generated, name));
      }
    } catch (err: any) {
      console.error("Failed to generate questions:", err);
      setError(err.message || "Failed to generate questions from uploaded documents");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    if (botId) {
      markSetupDone(botId, "customize");
      markSetupDone(botId, "install");
      if (docs.length > 0) {
        markSetupDone(botId, "knowledge");
      }
    }
    setShowGreeting(true);
  };

  const handleFinalExit = () => {
    // Clear draft
    localStorage.removeItem("ochreshift-onboarding-draft");
    if (botId) {
      markSetupDone(botId, "customize");
      markSetupDone(botId, "install");
      if (docs.length > 0) {
        markSetupDone(botId, "knowledge");
      }
    }
    if (botId && onSavedRef.current) {
      onSavedRef.current(botId);
    } else if (onCloseRef.current) {
      onCloseRef.current();
    } else {
      router.push("/dashboard");
    }
  };


  const mockBot = {
    bot_id: botId || "",
    name: name,
    accent: accent,
    welcome: welcome,
    suggestions: suggestions,
  } as AdminBot;

  return (

    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* --- UNIFIED TOP SECTION (Header + Stepper) --- */}
      <div className="bg-surface shrink-0 z-30 flex flex-col shadow-sm border-b border-border/50">
        {showGreeting ? (
          <div className="h-[64px] flex items-center px-6 md:px-10 justify-between">
            <div className="flex items-center gap-3">
              <OchreshiftLogo className="h-6 md:h-7 w-auto" />
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[12px] font-[700] flex items-center gap-1.5">
                <span>🎉</span> Setup Completed
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleFinalExit}
                className="px-3.5 py-1.5 rounded-lg border border-border/80 hover:bg-surface-hover text-fg text-[12.5px] font-[600] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Exit to Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 1. THIN TOP NAVBAR */}
            <div className="h-[64px] flex items-center px-6 md:px-10 justify-between">
              {/* Logo */}
              <div className="flex items-center">
                <OchreshiftLogo className="h-6 md:h-7 w-auto" />
              </div>

              {/* Center Pill */}
              <div className="hidden md:flex items-center justify-center">
                <span className="px-4 py-1.5 bg-panel/50 rounded-full text-[12px] font-[600] text-muted border border-border/50">Bot Onboarding</span>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <span className="hidden sm:inline-flex px-3 py-1 bg-accent/10 text-accent rounded-full text-[12px] font-[700]">
                  Step {currentStepIndex + 1} of {stepsList.length}
                </span>
                {onClose && (
                  <button
                    onClick={() => {
                      localStorage.removeItem("ochreshift-onboarding-draft");
                      onClose();
                    }}
                    className="text-muted hover:text-fg transition-colors flex items-center gap-2 font-[600] text-[13px] cursor-pointer"
                  >
                    <X size={16} strokeWidth={2.5} />
                    <span className="hidden sm:block">Skip</span>
                  </button>
                )}
              </div>
            </div>
            <div className="h-[2px] w-full bg-border/50">
              <div className="h-full bg-accent transition-all duration-700 ease-out" style={{ width: `${((currentStepIndex + 1) / 5) * 100}%` }} />
            </div>
            <div className="w-full py-4 flex justify-center">
              <div className="flex items-start justify-between w-full max-w-[500px] px-8">
                {stepsList.map((s, idx) => {
                  const isActive = idx === currentStepIndex;
                  const isCompleted = idx < currentStepIndex;
                  const Icon = s.icon;
                  return (
                    <div key={s.id} className="flex flex-col items-center gap-1.5">
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-all", isActive ? "bg-accent text-white" : isCompleted ? "bg-accent text-white" : "bg-surface border border-border text-muted")}>
                        {isCompleted ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                      </div>
                      <span className={cn("text-[11px] font-[700]", (isActive || isCompleted) ? "text-accent" : "text-muted")}>{s.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex overflow-hidden">
        {showGreeting ? (
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 md:p-10 lg:gap-12 gap-8 relative overflow-y-auto bg-gradient-to-br from-bg via-bg to-panel/30">
            {/* Confetti canvas */}
            <canvas ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-[60]" />

            {/* Ambient background glow */}
            <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />

            {/* LEFT COLUMN: Celebration, Details & Next Actions */}
            <div className="w-full max-w-[540px] flex flex-col gap-5 relative z-10 animate-fade-in-up">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-[750] w-fit shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Agent Live & Ready to Deploy</span>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h1 className="text-3xl md:text-[36px] font-[850] text-fg tracking-tight leading-[1.18]">
                  Congratulations!
                  <br />
                  <span className="text-accent">{store.config.name || name || "Your agent"}</span> is ready.
                </h1>
                <p className="mt-2.5 text-[14px] text-muted leading-relaxed max-w-lg">
                  Your AI assistant is configured with your branding and trained on your boutique knowledge. Try chatting with it live on the right, or deploy it to your website.
                </p>
              </div>

              {/* Bot Info Card */}
              <div className="grid grid-cols-2 gap-3.5 p-4 rounded-2xl border border-border/70 bg-surface/90 shadow-sm backdrop-blur-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-[750] uppercase tracking-wider text-muted mb-0.5">Bot Name</span>
                  <span className="text-[14.5px] font-[700] text-fg break-words">{store.config.name || name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-[750] uppercase tracking-wider text-muted mb-0.5">Bot ID</span>
                  <div className="flex items-center gap-1.5">
                    <code className="text-[12.5px] font-mono font-[700] text-accent truncate">{botId || "preview"}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(botId || "")}
                      title="Copy Bot ID"
                      className="text-muted hover:text-fg p-0.5 transition-colors cursor-pointer"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col pt-2.5 border-t border-border/50">
                  <span className="text-[10px] font-[750] uppercase tracking-wider text-muted mb-0.5">Knowledge Base</span>
                  <span className="text-[13px] font-[650] text-fg">
                    {docs.length > 0 ? `${docs.length} Source${docs.length === 1 ? "" : "s"} Indexed` : "Website Scraped & Indexed"}
                  </span>
                </div>
                <div className="flex flex-col pt-2.5 border-t border-border/50">
                  <span className="text-[10px] font-[750] uppercase tracking-wider text-muted mb-0.5">Brand Color</span>
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: store.config.accent || accent }} />
                    <span className="text-[12.5px] font-mono font-[650] text-fg uppercase">{store.config.accent || accent}</span>
                  </div>
                </div>
              </div>

              {/* Quick Embed Snippet Box */}
              <div className="rounded-2xl border border-border/70 bg-surface/90 dark:bg-[#0F111A] dark:border-white/10 p-3.5 shadow-sm flex flex-col gap-2 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-[750] uppercase tracking-wider text-muted dark:text-white/50">
                    1-Line Embed Snippet
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const mockBotForSnippet = {
                        bot_id: botId || "preview",
                        name: store.config.name || name,
                        accent: store.config.accent || accent,
                        design: { config: store.config }
                      } as any;
                      const snippet = SNIPPET_BUILDERS[platform](mockBotForSnippet);
                      await navigator.clipboard.writeText(snippet);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1600);
                    }}
                    className="px-3 py-1 rounded-md border border-border/80 bg-panel/60 hover:bg-surface-hover text-fg dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/10 text-[11.5px] font-[650] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                  >
                    {copied ? <><Check size={13} className="text-emerald-500 dark:text-emerald-400" /> Copied!</> : <><Copy size={13} /> Copy Snippet</>}
                  </button>
                </div>
                <div className="rounded-lg bg-panel/80 dark:bg-black/40 px-3 py-2 border border-border/60 dark:border-white/5 overflow-x-auto custom-scrollbar">
                  <code className="text-[12px] font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap block">
                    {`<script src="https://cdn.ochreshift.app/widget.js" data-bot-id="${botId || "preview"}" async></script>`}
                  </code>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleFinalExit}
                  className="w-full sm:flex-1 px-8 py-3.5 rounded-xl bg-accent text-white text-[14.5px] font-[700] hover:bg-accent-strong transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  Go to Dashboard <ArrowRight size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("ochreshift-onboarding-draft");
                    if (botId) {
                      markSetupDone(botId, "customize");
                      markSetupDone(botId, "install");
                      if (docs.length > 0) markSetupDone(botId, "knowledge");
                    }
                    if (onCloseRef.current) onCloseRef.current();
                    router.push("/dashboard#appearance");
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-border/80 bg-surface hover:bg-surface-hover text-fg text-[14px] font-[650] transition-colors cursor-pointer text-center"
                >
                  Customize in Studio
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: Live Interactive Chatbot Showcase */}
            <div className="w-full max-w-[440px] flex flex-col items-center relative z-10 animate-fade-in-up">
              <div className="flex items-center justify-between w-full mb-2 px-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-[700] text-fg">Live Bot Preview</span>
                </div>
                <span className="text-[11.5px] text-muted">Test responses in real-time</span>
              </div>

              <div className="w-full h-[580px] rounded-2xl shadow-2xl border border-border/80 overflow-hidden bg-surface relative flex flex-col ring-1 ring-black/5 dark:ring-white/10">
                <TestChatBox
                  botId={botId || "preview"}
                  botName={store.config.name || name}
                  welcomeMessage={store.config.welcome || welcome}
                  autoAnimate={false}
                  suggestions={store.config.suggestions?.length ? store.config.suggestions : suggestions}
                  previewMode={true}
                />
              </div>
            </div>

          </div>
        ) : (
          <>
            {/* LEFT PANEL: Steps & Forms */}
            <div className="flex w-full flex-col md:w-[480px] lg:w-[540px] xl:w-[600px] shrink-0 p-4 relative z-10 min-h-0 h-full">

              {/* Form Card */}
              <div className="bg-surface rounded-[24px] shadow-sm border border-border/60 flex flex-col flex-1 min-h-0 overflow-hidden relative">
                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-7 flex flex-col custom-scrollbar [scrollbar-gutter:stable]">
                  {error && (
                    <div className="mb-4 rounded-[8px] bg-warn/10 p-3 text-[13px] text-warn border border-warn/30 shrink-0">
                      {error}
                    </div>
                  )}

                  {/* Step 1: Website URL */}
                  {step === "intro" && (
                    <div className="flex flex-col flex-1">
                      <h2 className="text-[24px] font-[800] text-fg tracking-tight mb-2">
                        What is your business?
                      </h2>
                      <p className="mb-6 text-[14px] text-muted leading-relaxed">
                        Enter your website URL. We'll instantly fetch your business name, context, and generate a tailored welcome message.
                      </p>

                      <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-[650] text-fg">Website URL</label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://example.com"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleFetchWebsite()}
                            className="flex-1 rounded-[10px] border border-border bg-panel px-4 py-3 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring transition-all"
                          />
                          <button
                            onClick={handleFetchWebsite}
                            disabled={isProcessing || !websiteUrl}
                            className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-5 font-[650] text-white hover:bg-accent-strong disabled:opacity-50 transition-colors"
                          >
                            {isProcessing ? "Fetching..." : <><Zap className="h-4 w-4" /> Fetch</>}
                          </button>
                        </div>
                      </div>

                      <div className="relative flex items-center py-6 mt-4">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink-0 mx-4 text-faint text-[12px] font-[650] uppercase tracking-wider">or</span>
                        <div className="flex-grow border-t border-border"></div>
                      </div>

                      <button
                        onClick={() => setStep("profile")}
                        className="w-full rounded-[10px] border border-border bg-panel py-3 font-[650] text-fg hover:border-accent hover:text-accent transition-colors"
                      >
                        Skip and enter manually
                      </button>
                    </div>
                  )}

                  {step === "profile" && (
                    <div className="flex flex-col gap-5 animate-fade-in">
                      <div>
                        <h3 className="text-[20px] font-[750] text-fg tracking-tight">Customize your agent</h3>
                        <p className="mt-1 text-[13.5px] text-muted leading-relaxed">
                          Review the details we fetched, or tweak them to match your brand's tone.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3.5">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[13px] font-[650] text-fg">Agent Name</label>
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Sales Assistant"
                            className="w-full rounded-[10px] border border-border bg-panel px-4 py-2.5 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[13px] font-[650] text-fg">Welcome Message</label>
                          <textarea
                            value={welcome}
                            onChange={(e) => setWelcome(e.target.value)}
                            placeholder="Hi! How can I help you today?"
                            rows={5}
                            className="w-full rounded-[10px] border border-border bg-panel px-4 py-2.5 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Knowledge Base */}
                  {step === "knowledge" && (
                    <div className="flex flex-col gap-5 animate-fade-in">
                      <div>
                        <h3 className="text-[20px] font-[750] text-fg tracking-tight">Teach your agent</h3>
                        <p className="mt-1 text-[13.5px] text-muted leading-relaxed">
                          Upload your documents, FAQs, or pricing lists. Your agent will only answer based on what you provide.
                        </p>
                      </div>

                      {botId ? (
                        <div className="bg-panel rounded-[10px] overflow-hidden border border-border">
                          <DocsUpload botId={botId} />
                        </div>
                      ) : (
                        <div className="rounded-[10px] border border-dashed border-border bg-panel/50 p-6 text-center text-muted">
                          [ Saving agent... ]
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5 mt-2">
                        <label className="text-[13px] font-[650] text-fg flex items-center justify-between">
                          Suggested Questions
                          <div className={docs.length === 0 ? "relative group cursor-not-allowed" : "relative group"}>
                            <button
                              onClick={handleGenerateQuestions}
                              disabled={isProcessing || docs.length === 0}
                              className="text-accent hover:underline disabled:opacity-50 disabled:no-underline disabled:pointer-events-none text-[12px]"
                            >
                              {isProcessing ? "Generating..." : "Generate from docs"}
                            </button>
                            {docs.length === 0 && (
                              <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block bg-fg text-bg text-[11px] font-[650] px-2.5 py-1.5 rounded-[6px] whitespace-nowrap z-50 shadow-md pointer-events-none animate-fade-in-up">
                                Upload a document first
                                <div className="absolute top-full right-4 w-0 h-0 border-l-[4px] border-l-transparent border-t-[4px] border-t-fg border-r-[4px] border-r-transparent" />
                              </div>
                            )}
                          </div>
                        </label>
                        <textarea
                          value={suggestions.join("\n")}
                          onChange={(e) => setSuggestions(e.target.value.split("\n"))}
                          placeholder="What is your pricing?\nHow do I contact support?"
                          rows={3}
                          className="w-full rounded-[10px] border border-border bg-panel px-4 py-2.5 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring resize-none"
                        />
                        <p className="text-[11.5px] text-faint">Put each question on a new line.</p>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Appearance */}
                  {step === "appearance" && (
                    <div className="flex flex-col gap-4 animate-fade-in flex-1">
                      <div>
                        <h3 className="text-[20px] font-[750] text-fg tracking-tight">Customize appearance</h3>
                        <p className="mt-1 text-[13.5px] text-muted leading-relaxed">
                          Fine-tune how your widget looks on your website.
                        </p>
                      </div>
                      <Studio botId={botId || ""} hideBanner={true} controlsOnly={true} />
                    </div>
                  )}

                  {/* Step 5: Install (Left Pane) */}
                  {step === "install" && (
                    <div className="flex flex-col gap-4 flex-1 min-h-0">
                      <div>
                        <h3 className="text-[19px] font-[750] text-fg tracking-tight">Install your agent</h3>
                        <p className="mt-0.5 text-[13px] text-muted leading-relaxed">
                          Integrate the chat widget into your website. Choose your platform below for tailored instructions.
                        </p>
                      </div>

                      {/* Platform Grid */}
                      <div>
                        <h3 className="text-[12px] font-[700] text-fg uppercase tracking-wider mb-2">1. Select Platform</h3>
                        <div className="grid grid-cols-3 gap-2.5">
                          {PLATFORMS.map((p) => {
                            const isActive = platform === p.key;
                            return (
                              <button
                                key={p.key}
                                onClick={() => setPlatform(p.key)}
                                className={cn(
                                  "group relative flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 transition-all duration-200 cursor-pointer",
                                  isActive
                                    ? "border-accent bg-accent/5 shadow-[0_0_15px_-4px_rgba(var(--accent-rgb),0.3)] ring-1 ring-accent/20"
                                    : "border-border bg-surface hover:bg-surface-hover hover:border-border-strong hover:-translate-y-0.5 shadow-sm"
                                )}
                              >
                                <div className={cn("transition-colors duration-200", isActive ? "text-accent" : "text-muted group-hover:text-fg " + p.color)}>
                                  {p.icon}
                                </div>
                                <span className={cn("text-[11.5px] font-[650] transition-colors", isActive ? "text-accent" : "text-fg")}>
                                  {p.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Timeline Steps */}
                      <div>
                        <h3 className="text-[12px] font-[700] text-fg uppercase tracking-wider mb-2">2. Follow Instructions</h3>
                        <div className="relative border-l border-border/80 ml-3 pl-5 space-y-3 py-0.5 min-h-[150px]">
                          {WHERE_TO_PASTE[platform].map((stepDesc, i) => (
                            <div key={i} className="relative">
                              <div className="absolute -left-[27px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10.5px] font-[750] text-white ring-4 ring-bg shadow-sm">
                                {i + 1}
                              </div>
                              <p className="text-[13px] text-fg leading-relaxed pt-0.5">{stepDesc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Callout */}
                      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex gap-2.5 items-start mt-auto shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" /><path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="8" r="1" fill="currentColor" /></svg>
                        <div className="text-[11.5px] text-blue-500/90 leading-relaxed">
                          Only visitors on domains you allow will get answers — set those under <strong>Settings → Allowed domains</strong>. The snippet is safe to commit to your site's code; it contains no secret keys.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pinned Sticky Navigation Footer */}
                {step !== "intro" && (
                  <div className="px-6 md:px-7 py-3.5 bg-surface border-t border-border/60 flex items-center justify-between shrink-0 z-20">
                    <button
                      type="button"
                      onClick={() =>
                        step === "profile" ? setStep("intro") :
                          step === "knowledge" ? setStep("profile") :
                            step === "appearance" ? setStep("knowledge") :
                              setStep("appearance")
                      }
                      disabled={isProcessing}
                      className="px-5 py-2.5 rounded-[12px] text-[13.5px] font-[600] text-muted hover:text-fg hover:bg-panel transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={
                        step === "profile" ? handleCreateBot :
                          step === "knowledge" ? handleGoToAppearance :
                            step === "appearance" ? handleSaveAppearanceAndContinue :
                              handleComplete
                      }
                      disabled={isProcessing || (step === "profile" && !name.trim())}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-[12px] bg-accent text-white text-[13.5px] font-[600] hover:bg-accent-strong transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing
                        ? "Saving..."
                        : step === "knowledge" && docs.length === 0
                          ? "Skip for now"
                          : step === "install"
                            ? "Finish Setup"
                            : "Next Step"}
                      {!isProcessing && <ArrowRight size={15} />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL: Live Chatbot Preview / Developer Studio */}
            <div className={cn(
              "hidden flex-1 md:flex flex-col relative transition-colors duration-500 min-h-0",
              step === "install"
                ? "bg-[#090B10] p-6 lg:p-8 justify-center items-center overflow-hidden"
                : "items-center justify-start pt-10 p-10 bg-transparent overflow-hidden"
            )}>
              {/* Background grid pattern for Step 5 install */}
              {step === "install" && (
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
              )}

              {/* Only show the website iframe if we are past Step 1 AND not on install step */}
              {step !== "intro" && step !== "install" && (
                <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden bg-bg">
                  <iframe src={canFrame === false ? "https://ochreshift.in" : (websiteUrl || "https://ochreshift.in")} className="w-full h-full border-none pointer-events-none opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
                </div>
              )}

              {/* If we have a botId and are on step 3 or 4, show the actual TestChatBox */}
              {step === "intro" ? (
                <div className="relative z-10 w-full max-w-[850px] flex flex-col items-center gap-6">
                  {/* Video Title Header */}
                  <div className="text-center animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[12px] font-[700] uppercase tracking-wider mb-2 border border-accent/20">
                      <Sparkles size={14} /> Quick Tutorial
                    </div>
                    <h3 className="text-[24px] font-[800] text-fg tracking-tight">See Ochreshift in Action</h3>
                    <p className="text-[14px] text-muted mt-2 max-w-[380px] mx-auto">Watch how we automate your customer support by instantly learning from your website.</p>
                  </div>

                  <div className="relative w-full aspect-video rounded-[24px] shadow-2xl bg-surface border border-border overflow-visible flex flex-col justify-center items-center group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    {!isVideoPlaying && (
                      <>
                        <img src="/onboard-light.webp" alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover rounded-[24px] z-0 block dark:hidden" />
                        <img src="/onboard-dark.webp" alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover rounded-[24px] z-0 hidden dark:block" />

                        {/* Subtle overlay so the play button stands out */}
                        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 rounded-[24px] z-0 pointer-events-none" />

                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center gap-5 cursor-pointer hover:bg-black/20 dark:hover:bg-black/40 transition-colors z-10 overflow-hidden rounded-[24px]"
                          onClick={() => setIsVideoPlaying(true)}
                        >
                          <div className="relative z-20 h-20 w-20 rounded-full bg-surface/80 dark:bg-surface/60 backdrop-blur-sm border border-border flex items-center justify-center shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 group-hover:bg-accent/20 group-hover:border-accent/30">
                            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-accent border-b-[12px] border-b-transparent ml-2" />
                          </div>
                        </div>
                      </>
                    )}
                    {isVideoPlaying && (() => {
                      const videoSrc = isDarkTheme 
                        ? process.env.NEXT_PUBLIC_DEMO_VIDEO_DARK || "/demo.mp4" 
                        : process.env.NEXT_PUBLIC_DEMO_VIDEO_LIGHT || "/demo.mp4";
                        
                      const isYouTube = videoSrc.includes("youtube.com") || videoSrc.includes("youtu.be");

                      if (isYouTube) {
                        // Ensure autoplay works and minimize YouTube branding/UI
                        let ytSrc = videoSrc.includes("?") ? `${videoSrc}&autoplay=1` : `${videoSrc}?autoplay=1`;
                        ytSrc += "&modestbranding=1&rel=0&iv_load_policy=3";
                        
                        return (
                          <iframe
                            key={isDarkTheme ? "dark" : "light"}
                            className="absolute inset-0 w-full h-full z-20 rounded-[24px]"
                            src={ytSrc}
                            title="Demo Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        );
                      }

                      return (
                        <video
                          key={isDarkTheme ? "dark" : "light"}
                          className="absolute inset-0 w-full h-full object-cover z-20 rounded-[24px]"
                          autoPlay
                          controls
                          playsInline
                        >
                          <source src={videoSrc} type="video/mp4" />
                        </video>
                      );
                    })()}
                  </div>
                </div>
              ) : step === "appearance" ? (
                <div className="absolute inset-0 z-10 pointer-events-none" ref={widgetContainerRef}>
                  <OchreshiftWidget positionMode="absolute" themeScopeRef={widgetContainerRef} />
                </div>
              ) : step === "install" ? (
                <div className="w-full max-w-[850px] flex flex-col h-[540px] max-h-[calc(100vh-220px)] min-h-[440px] relative z-10 mx-auto">
                  {/* Status header above code card */}
                  <div className="flex items-center justify-between w-full mb-3 px-1 text-xs shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-[650] text-white">Widget Ready to Deploy</span>
                    </div>
                    <span className="font-mono text-white/60 text-[11.5px]">
                      {store.config.name || name} · {platform.toUpperCase()}
                    </span>
                  </div>

                  <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#0F111A] flex flex-col ring-1 ring-white/5 flex-1 min-h-0">
                    {/* Window Header */}
                    <div className="relative flex items-center justify-between px-4 py-2.5 bg-[#1A1D27] border-b border-white/10 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/80"></div>
                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/80"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/80"></div>
                      </div>

                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 font-mono text-[11.5px] text-white/75 pointer-events-none shadow-2xs">
                        <span>{FILE_LABEL[platform]}</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const mockBotForSnippet = {
                              bot_id: botId || "preview",
                              name: store.config.name || name,
                              accent: store.config.accent || accent,
                              design: { config: store.config }
                            } as any;
                            const snippet = SNIPPET_BUILDERS[platform](mockBotForSnippet);
                            await navigator.clipboard.writeText(snippet);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1600);
                          } catch { }
                        }}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-[650] transition-all duration-300 cursor-pointer",
                          copied
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/10 text-white/80 border border-white/15 hover:bg-white/20 hover:text-white"
                        )}
                      >
                        {copied ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy code
                          </>
                        )}
                      </button>
                    </div>

                    {/* Window Body (Code) */}
                    <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
                      <pre className="p-5 md:p-6 pb-8 overflow-y-auto overflow-x-auto flex-1 min-h-0 custom-scrollbar [scrollbar-gutter:stable]">
                        <code className="font-mono text-[13px] leading-[1.75] text-[#A6ACCD]">
                          {highlightSnippet(SNIPPET_BUILDERS[platform]({
                            bot_id: botId || "preview",
                            name: store.config.name || name,
                            accent: store.config.accent || accent,
                            design: { config: store.config }
                          } as any))}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-6 right-6 z-10 animate-fade-in-up w-[420px] h-full max-h-[650px]">
                  <TestChatBox
                    botId={botId || "preview"}
                    botName={name}
                    welcomeMessage={welcome}
                    autoAnimate={step === "profile"}
                    suggestions={suggestions}
                    previewMode={true}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showVerificationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border shadow-2xl rounded-[24px] p-8 max-w-[420px] w-full text-center relative animate-fade-in-up">
            <button
              onClick={() => {
                setShowVerificationModal(false);
                setIsEditingEmail(false);
                setResendMessage("");
              }}
              className="absolute top-4 right-4 text-muted hover:text-fg transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mx-auto w-16 h-16 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mb-6 border border-orange-500/30">
              <LogOut size={28} className="ml-1" />
            </div>

            {!isEditingEmail ? (
              <>
                <h3 className="text-[22px] font-[800] text-fg tracking-tight mb-2">Check your email</h3>
                <p className="text-[14px] text-muted mb-6 leading-relaxed">
                  We sent a verification link to <strong className="text-fg">{session?.user?.email}</strong>. Please click the link to verify your account before creating your first agent.
                </p>
                {resendMessage && (
                  <p className="text-[13px] font-[500] text-accent mb-4">{resendMessage}</p>
                )}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={async () => {
                      try {
                        const fresh = await authClient.getSession();
                        if (fresh?.data?.user?.emailVerified) {
                          setShowVerificationModal(false);
                          handleCreateBot();
                          return;
                        }
                      } catch { }
                      setShowVerificationModal(false);
                    }}
                    className="w-full py-3 bg-accent text-white rounded-xl font-[600] text-[15px] hover:bg-accent-strong transition-colors"
                  >
                    Okay, I'll check
                  </button>
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full py-3 bg-panel text-fg rounded-xl font-[600] text-[15px] hover:bg-panel/80 transition-colors disabled:opacity-50"
                  >
                    {isResending ? "Sending..." : "Resend magic link"}
                  </button>
                  <button
                    onClick={() => {
                      setNewEmail(session?.user?.email || "");
                      setIsEditingEmail(true);
                      setResendMessage("");
                    }}
                    className="text-[13px] text-muted hover:text-fg underline underline-offset-2 transition-colors mt-2"
                  >
                    Wrong email? Change it here.
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-[22px] font-[800] text-fg tracking-tight mb-2">Change Email</h3>
                <p className="text-[14px] text-muted mb-6 leading-relaxed">
                  Enter your correct email address below. We will send a new verification link.
                </p>
                <div className="flex flex-col gap-4 text-left">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email..."
                    className="w-full rounded-[10px] border border-border bg-panel px-4 py-3 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring"
                  />
                  {resendMessage && (
                    <p className="text-[13px] font-[500] text-accent text-center">{resendMessage}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => {
                        setIsEditingEmail(false);
                        setResendMessage("");
                      }}
                      className="flex-1 py-3 bg-panel text-fg rounded-xl font-[600] text-[15px] hover:bg-panel/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangeEmail}
                      disabled={isResending || !newEmail}
                      className="flex-1 py-3 bg-accent text-white rounded-xl font-[600] text-[15px] hover:bg-accent-strong transition-colors disabled:opacity-50"
                    >
                      {isResending ? "Saving..." : "Save & Verify"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
