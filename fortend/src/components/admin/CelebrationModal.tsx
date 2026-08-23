import { useState, useEffect, useMemo } from "react";
import { X, ArrowRight } from "lucide-react";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";
import { cn } from "@/lib/cn";

export function CelebrationModal({ onClose }: { onClose: () => void }) {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mount delay to trigger entrance animations cleanly
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 350);
  };

  const getTransition = (delay: number) => ({
    transitionDelay: `${delay}ms`,
    transitionDuration: '500ms',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
  });

  const fadeUpClass = cn(
    "transform transition-all",
    mounted && !isClosing ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-[0.98]"
  );

  // Memoize particle values for a single, refined pop
  const particles = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => {
      const angle = (i * 360) / 10 + (Math.random() * 10 - 5);
      const distance = 40 + Math.random() * 15;
      const duration = 0.5 + Math.random() * 0.2;
      return { angle, distance, duration, delay: 0.1 };
    });
  }, []);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes particle-drift {
          0% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(0px) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(var(--d)) scale(0); opacity: 0; }
        }
        @keyframes flash-fade {
          0% { transform: scale(0.5); opacity: 1; }
          20% { transform: scale(1.5); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}} />

      {/* 0ms: Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-background/60 backdrop-blur-md transition-all duration-500",
          mounted && !isClosing ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* 50ms: Modal Container */}
      <div
        className={cn(
          "relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-[24px] border border-border bg-surface p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.2)] transition-all duration-500 ease-out",
          mounted && !isClosing ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
        )}
        style={{ transitionDelay: '50ms' }}
      >
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 rounded-full p-2 text-muted hover:bg-panel hover:text-fg transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 100ms: WOW GRAPHIC DESIGN VISUAL */}
        <div 
          className="relative flex h-40 w-full items-center justify-center mb-2 transition-all duration-700"
          style={{
            opacity: mounted && !isClosing ? 1 : 0,
            transform: mounted && !isClosing ? 'translateY(0)' : 'translateY(10px)',
            transitionDelay: '100ms'
          }}
        >
           {/* Dynamic Ambient Background */}
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-32 rounded-full bg-accent/10 blur-[30px] animate-pulse" style={{ animationDuration: '3s' }} />
           </div>

           {/* Orbital Elements */}
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-[110px] w-[110px] animate-[spin_20s_linear_infinite]">
                 {/* Orbiting Sparkles */}
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-accent/60 animate-pulse">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>
                 </div>
                 <div className="absolute -bottom-2 right-4 text-accent/40 animate-pulse" style={{ animationDelay: '1s' }}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>
                 </div>
                 <div className="absolute top-10 -left-4 text-accent/30 animate-pulse" style={{ animationDelay: '2s' }}>
                   <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" /></svg>
                 </div>
              </div>
           </div>

          {/* Single Particle Burst */}
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 w-[3px] h-[3px] rounded-full bg-accent"
              style={{
                '--a': `${p.angle}deg`,
                '--d': `-${p.distance + 20}px`,
                animation: mounted && !isClosing ? `particle-drift ${p.duration + 0.5}s cubic-bezier(0.16, 1, 0.3, 1) ${p.delay}s forwards` : 'none',
                opacity: 0
              } as React.CSSProperties}
            />
          ))}

           {/* The Hero Mark */}
           <div className="relative z-10 flex items-center justify-center">
              {/* Vibrant shadow (the exact same logo blurred) */}
              <OchreshiftLogo variant="mark" className="absolute h-[76px] w-[76px] blur-[8px] opacity-[0.15]" />
              
              {/* The crisp logo */}
              <OchreshiftLogo variant="mark" className="relative h-[76px] w-[76px]" />
              
              {/* A brilliant light flash on entrance */}
              <div 
                className="absolute inset-0 rounded-full bg-accent/50 blur-xl"
                style={{
                  animation: mounted && !isClosing ? `flash-fade 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards` : 'none',
                  opacity: 0
                }}
              />
           </div>
        </div>

        {/* Typography */}
        <div className="flex flex-col items-center text-center px-2">
          {/* 150ms: Status */}
          <div
            className={cn("mb-4 flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-[750] uppercase tracking-[0.15em] text-accent", fadeUpClass)}
            style={getTransition(150)}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            Agent Live
          </div>

          {/* 180ms: Headline */}
          <h2
            id="celebration-title"
            className={cn("mb-3 text-[28px] sm:text-[30px] font-[750] tracking-tight text-fg leading-tight", fadeUpClass)}
            style={getTransition(180)}
          >
            You built something great.
          </h2>

          {/* 250ms: Emotional Acknowledgment */}
          <div
            className={cn("mb-8 flex flex-col gap-1.5 text-[15px] leading-relaxed", fadeUpClass)}
            style={getTransition(250)}
          >
            <span className="font-[650] text-fg">Seriously nice work.</span>
            <span className="text-muted">You configured it, trained it, and brought it online.<br />Now it's ready to start talking to your customers.</span>
          </div>
        </div>

        {/* 330ms: Next Steps Sequence */}
        <div
          className={cn("w-full text-left mb-8", fadeUpClass)}
          style={getTransition(330)}
        >
          <div className="mb-3 text-[11px] font-[700] uppercase tracking-[0.1em] text-muted px-1">
            Now, let's get it working
          </div>

          <div className="flex flex-col gap-1 rounded-2xl bg-panel/30 border border-border/50 p-2">
            <div className="flex items-start gap-4 rounded-xl p-3">
              <div className="mt-0.5 text-[12px] font-[700] text-accent/60">01</div>
              <div>
                <h3 className="text-[14px] font-[600] text-fg">Add it to your website</h3>
                <p className="text-[13px] text-muted leading-snug mt-0.5">
                  One line of code from Install.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl p-3">
              <div className="mt-0.5 text-[12px] font-[700] text-accent/60">02</div>
              <div>
                <h3 className="text-[14px] font-[600] text-fg">Let OchreShift do its thing</h3>
                <p className="text-[13px] text-muted leading-snug mt-0.5">
                  Customer conversations automatically flow into Leads.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 400ms: CTA */}
        <div
          className={cn("w-full flex flex-col items-center", fadeUpClass)}
          style={getTransition(400)}
        >
          <button
            onClick={handleClose}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-accent to-accent-strong text-white px-6 text-[15px] font-[650] shadow-[0_8px_20px_-8px_rgba(var(--color-accent),0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(var(--color-accent),0.7)] active:translate-y-0"
          >
            Let's put it to work
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>

          <p className="mt-4 text-[12.5px] font-[500] text-muted">
            Now go see what your agent can do.
          </p>
        </div>
      </div>
    </div>
  );
}
