import { Sparkles, Terminal, X, ChevronRight } from "lucide-react";

export function CreationChoiceModal({
  onSelectWizard,
  onSelectAdvanced,
  onClose,
}: {
  onSelectWizard: () => void;
  onSelectAdvanced: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-panel hover:text-fg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="mb-2 text-xl font-bold text-fg">How would you like to build your agent?</h2>
        <p className="mb-6 text-[14px] text-muted">
          Choose the setup experience that works best for you.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onSelectWizard}
            className="group flex items-start gap-4 rounded-xl border border-border bg-panel/30 p-4 text-left transition-all hover:border-accent hover:bg-accent/5 hover:shadow-sm"
          >
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-fg text-[14.5px]">Use Onboarding Wizard</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">Recommended</span>
              </div>
              <p className="mt-1 text-[13px] text-muted">A step-by-step guided setup for your agent's knowledge, design, and behavior.</p>
            </div>
            <ChevronRight className="h-5 w-5 self-center text-muted group-hover:text-accent transition-colors" />
          </button>

          <button
            onClick={onSelectAdvanced}
            className="group flex items-start gap-4 rounded-xl border border-border bg-panel/30 p-4 text-left transition-all hover:border-fg/40 hover:bg-fg/5 hover:shadow-sm"
          >
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-panel text-muted group-hover:bg-fg group-hover:text-surface transition-colors">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-fg text-[14.5px]">Advanced Setup</span>
              </div>
              <p className="mt-1 text-[13px] text-muted">Skip the wizard. Just give us a name and configure everything manually in the dashboard.</p>
            </div>
            <ChevronRight className="h-5 w-5 self-center text-muted group-hover:text-fg transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
