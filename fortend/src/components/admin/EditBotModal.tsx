import { useState } from "react";
import { X, Loader2, Type } from "lucide-react";
import { createBot, type AdminBot } from "@/lib/adminApi";

export function EditBotModal({
  bot,
  onClose,
  onSaved,
}: {
  bot: AdminBot;
  onClose: () => void;
  onSaved: (botId: string) => void;
}) {
  const [name, setName] = useState(bot.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a name for your agent.");
      return;
    }
    
    setIsSaving(true);
    setError("");

    try {
      const draft = {
        botId: bot.bot_id,
        name: name.trim(),
        accent: bot.accent,
        welcome: bot.welcome,
        suggestions: bot.suggestions,
        allowedDomains: bot.allowed_domains,
        notificationEmail: bot.notification_email || undefined,
        webhookUrl: bot.webhook_url || undefined,
        googleSheetsUrl: bot.google_sheets_url || undefined,
        whatsappPhoneNumberId: bot.whatsapp_phone_number_id || undefined,
        modelOverride: bot.model_override || undefined,
        customPromptStyle: bot.custom_prompt_style || undefined,
      };
      
      const newBot = await createBot(draft);
      onSaved(newBot.botId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update agent");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95">
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-panel hover:text-fg transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="mb-1 text-xl font-bold text-fg">Edit Agent</h2>
        <p className="mb-6 text-[14px] text-muted">
          Update the basic details of your agent.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-[650] text-fg">
              Agent Name
            </label>
            <div className="relative">
              <Type className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
              <input
                type="text"
                autoFocus
                disabled={isSaving}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sales Assistant"
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-[14px] text-fg transition-colors placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-bad/10 p-3 text-[13px] text-bad font-medium">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl px-4 py-2 text-[14px] font-[650] text-muted hover:text-fg disabled:opacity-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-accent to-accent-strong px-5 py-2 text-[14px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--color-accent)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_var(--color-accent)] active:translate-y-0 disabled:translate-y-0 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
