import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";

export function WelcomeModal({ user, hasBots = false }: { user: any; hasBots?: boolean }) {
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Skip for users who already completed onboarding (have bots)
    if (hasBots) return;
    // Check if we've already welcomed the user (persistent, not per-tab)
    const hasSeenWelcome = localStorage.getItem("ochreshift_welcome_seen");
    if (!hasSeenWelcome) {
      // Small delay for dramatic effect
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, [hasBots]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShow(false);
      localStorage.setItem("ochreshift_welcome_seen", "true");
    }, 300); // match exit animation duration
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          isClosing ? "opacity-0" : "animate-in fade-in"
        )}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative flex w-full max-w-md flex-col items-center overflow-hidden rounded-2xl border border-border bg-surface p-8 shadow-2xl transition-all duration-300",
          isClosing ? "scale-95 opacity-0" : "animate-in zoom-in-95 fade-in"
        )}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-panel hover:text-fg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-accent/10 border border-accent/20 shadow-[0_0_40px_rgba(var(--color-accent),0.2)]">
          <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" style={{ animationDuration: '3s' }} />
          <OchreshiftLogo variant="mark" className="h-12 w-12" />
          <Sparkles className="absolute -right-2 -top-2 h-7 w-7 animate-pulse text-amber-500 drop-shadow-md" />
        </div>

        <h2 className="mb-2 text-center text-2xl font-bold tracking-tight text-fg">
          Welcome to OchreShift, {user?.name?.split(' ')[0] || 'there'}!
        </h2>

        <p className="mb-8 text-center text-[14.5px] leading-relaxed text-muted">
          We're thrilled to have you on board. ochreshift makes it incredibly easy to create intelligent AI agents for your website, capture leads, and automate your support.
        </p>

        <button
          onClick={handleClose}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 text-[14.5px] font-[650] text-white shadow-md shadow-accent/20 transition-all hover:scale-[1.02] hover:bg-accent-strong active:scale-[0.98]"
        >
          Let's get started
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
