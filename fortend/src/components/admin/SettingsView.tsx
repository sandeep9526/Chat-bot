"use client";

import { useState, useEffect, useMemo } from "react";
import type { AdminBot } from "@/lib/adminApi";
import { testNotificationEmail, testWebhook } from "@/lib/adminApi";
import { useCreateBot } from "@/hooks/useAdmin";
import { authClient, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/panel/AppShell";
import { GoogleSheetsSyncModal } from "./GoogleSheetsSyncModal";
import { ChangePasswordSection } from "./ChangePasswordSection";
import {
  Mail,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check as LucideCheck,
  Code2,
} from "lucide-react";

// Simple UI icons to reduce external dependencies
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-4 h-4", className)}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-4 h-4", className)}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );
}



type TabKey = "general" | "integrations" | "account";

export function SettingsView({
  bot,
  email,
  onLogout,
  onGoto,
}: {
  bot?: AdminBot;
  email: string;
  onLogout: () => void;
  onGoto?: (s: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const updateBot = useCreateBot();
  
  // General State
  const [modelOverride, setModelOverride] = useState(bot?.model_override ?? "");
  const [customPromptStyle, setCustomPromptStyle] = useState(bot?.custom_prompt_style ?? "");
  const [domains, setDomains] = useState((bot?.allowed_domains ?? ["*"]).join(", "));
  
  // Integrations State
  const [notifEmail, setNotifEmail] = useState(bot?.notification_email ?? "");
  const [webhook, setWebhook] = useState(bot?.webhook_url ?? "");
  const [googleSheets, setGoogleSheets] = useState(bot?.google_sheets_url ?? "");
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  
  // UI State
  const [integrationMsg, setIntegrationMsg] = useState("");

  // Integrations Testing State
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showPayloadPreview, setShowPayloadPreview] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  

  
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (bot) {
      setNotifEmail(bot.notification_email ?? "");
      setWebhook(bot.webhook_url ?? "");
      setGoogleSheets(bot.google_sheets_url ?? "");
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
        modelOverride: modelOverride.trim() || undefined,
        customPromptStyle: customPromptStyle.trim() || undefined,
      });
      setIntegrationMsg("Settings saved successfully.");
      setTimeout(() => setIntegrationMsg(""), 4000);
    } catch (e: any) {
      setIntegrationMsg("Couldn't save settings: " + (e?.message || "Unknown error"));
    }
  };

  const handleTestEmail = async () => {
    if (!bot || !notifEmail.trim()) return;
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await testNotificationEmail(bot.bot_id, notifEmail.trim());
      setEmailTestResult({ ok: true, message: res.message || "Test email sent successfully!" });
      setTimeout(() => setEmailTestResult(null), 6000);
    } catch (err: any) {
      setEmailTestResult({ ok: false, message: err?.message || "Failed to send test email." });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!bot || !webhook.trim()) return;
    setTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await testWebhook(bot.bot_id, webhook.trim());
      setWebhookTestResult({ ok: true, message: res.message || "Webhook test delivered successfully!" });
      setTimeout(() => setWebhookTestResult(null), 6000);
    } catch (err: any) {
      setWebhookTestResult({ ok: false, message: err?.message || "Failed to connect to webhook URL." });
    } finally {
      setTestingWebhook(false);
    }
  };

  const samplePayload = useMemo(() => JSON.stringify({
    event: "lead.created",
    botId: bot?.bot_id || "your-bot-id",
    botName: bot?.name || "Ochreshift Assistant",
    lead: {
      id: 101,
      name: "Alex Smith",
      email: "alex@example.com",
      phone: "+1 555-0199",
      message: "Interested in premium package pricing",
      score: "hot",
      summary: "High intent inquiry looking to book consultation."
    },
    timestamp: new Date().toISOString()
  }, null, 2), [bot]);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(samplePayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
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

  // Reusable component for a settings row
  const SettingRow = ({ 
    title, 
    description, 
    badge,
    children 
  }: { 
    title: string; 
    description: string; 
    badge?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="flex flex-col lg:flex-row gap-6 py-6 border-b border-border last:border-0">
      <div className="lg:w-1/3 flex flex-col gap-1.5 shrink-0">
        <h4 className="text-[14px] font-[750] text-fg">{title}</h4>
        <p className="text-[13px] text-muted leading-relaxed max-w-[90%]">{description}</p>
        {badge}
      </div>
      <div className="lg:w-2/3 max-w-xl">
        {children}
      </div>
    </div>
  );

  return (
    <div className="w-full animate-fade-in pb-20">
      <SectionHeader title="Settings" description="Manage your agent's identity, integrations, and account security." />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-border pb-px">
        {[
          { id: "general", label: "General" },
          { id: "integrations", label: "Integrations" },
          { id: "account", label: "Account & Privacy" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabKey)}
            className={cn(
              "px-4 py-2.5 text-[13.5px] font-[650] relative transition-colors",
              activeTab === tab.id ? "text-fg" : "text-muted hover:text-fg"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent rounded-t-full shadow-[0_-2px_10px_rgba(var(--accent-rgb),0.5)]"></div>
            )}
          </button>
        ))}
      </div>

      {/* Container */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 md:px-8">
          
          {/* ================= GENERAL TAB ================= */}
          {activeTab === "general" && (
            <div className="animate-fade-in flex flex-col">
              


              <SettingRow 
                title="AI Model" 
                description="Choose the LLM that powers your agent's responses. Automatic selects the best available model."
              >
                <div className="flex flex-col gap-3">
                  <select
                    value={modelOverride}
                    onChange={(e) => setModelOverride(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-[600] text-fg outline-none focus:border-accent transition-colors hover:border-border-strong"
                  >
                    <option value="">Automatic (recommended) — we pick the best model</option>
                    <option value="meta-llama/llama-3.3-70b-instruct:free">LLaMA 3.3 70B — best reasoning</option>
                    <option value="google/gemini-2.0-flash-lite-preview-02-05:free">Gemini 2.0 Flash Lite — fastest replies</option>
                    <option value="mistralai/mistral-nemo:free">Mistral Nemo 12B — best for multiple languages</option>
                    <option value="qwen/qwen-2.5-coder-32b-instruct">Qwen 2.5 32B — best for technical questions</option>
                  </select>
                </div>
              </SettingRow>

              <SettingRow 
                title="Custom Prompt Style" 
                description="Add specific personality traits or tone rules (e.g., 'Always be extremely polite and use emojis')."
              >
                <textarea
                  value={customPromptStyle}
                  onChange={(e) => setCustomPromptStyle(e.target.value)}
                  placeholder="e.g. Speak like a pirate..."
                  className="w-full h-24 rounded-xl border border-border bg-surface p-4 text-[13px] text-fg outline-none focus:border-accent resize-none placeholder:text-muted/60 transition-colors hover:border-border-strong"
                />
              </SettingRow>

              <SettingRow 
                title="Allowed Domains" 
                description="Comma-separated list of domains allowed to use your widget. Use * to allow anywhere."
              >
                <input
                  type="text"
                  value={domains}
                  onChange={(e) => setDomains(e.target.value)}
                  placeholder="example.com, myblog.com"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] text-fg outline-none focus:border-accent transition-colors hover:border-border-strong"
                />
              </SettingRow>

            </div>
          )}


          {/* ================= INTEGRATIONS TAB ================= */}
          {activeTab === "integrations" && (
            <div className="animate-fade-in flex flex-col">

              <SettingRow 
                title="Email Notifications" 
                description="Receive an instant email alert whenever a high-intent visitor provides their contact details."
                badge={
                  <div className="mt-2 p-3 rounded-xl border border-border bg-panel/40 flex flex-col gap-1 max-w-[90%]">
                    <span className="text-[11.5px] font-[700] text-fg">AI Intent Filter</span>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Instant alerts trigger for Hot and Warm leads so your sales inbox stays focused on high-value prospects.
                    </p>
                  </div>
                }
              >
                <div className="flex flex-col gap-3">
                  <div className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border transition-colors",
                    notifEmail ? "bg-good/5 border-good/20 text-good" : "bg-surface border-border text-muted"
                  )}>
                    <div className="flex items-center gap-2">
                      {notifEmail ? <CheckIcon className="w-4 h-4 text-good" /> : <div className="w-4 h-4 rounded-full border border-current opacity-50" />}
                      <span className="text-[12.5px] font-[600]">
                        {notifEmail ? "Connected & Active" : "Not configured"}
                      </span>
                    </div>

                    {notifEmail && (
                      <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={testingEmail}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-panel text-fg font-[650] text-xs transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {testingEmail ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5" />
                            <span>Send Test Email</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {emailTestResult && (
                    <div className={cn(
                      "p-3 rounded-xl border text-[12px] font-[600] flex items-center gap-2 animate-fade-in",
                      emailTestResult.ok ? "bg-good/10 border-good/25 text-good" : "bg-bad/10 border-bad/25 text-bad"
                    )}>
                      {emailTestResult.ok ? <CheckIcon className="w-4 h-4" /> : <AlertTriangleIcon className="w-4 h-4" />}
                      <span>{emailTestResult.message}</span>
                    </div>
                  )}

                  <input
                    type="email"
                    value={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.value)}
                    placeholder="sales@yourcompany.com"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] text-fg outline-none focus:border-accent transition-colors hover:border-border-strong"
                  />
                  <p className="text-[12px] text-muted ml-1">
                    Delivered within seconds of lead submission. Remember to click "Save changes" below after editing.
                  </p>
                </div>
              </SettingRow>

              <SettingRow 
                title="Webhook URL" 
                description="Stream live lead events to Zapier, Make.com, HubSpot, Salesforce, or your custom server."
                badge={
                  <div className="mt-2 p-3 rounded-xl border border-border bg-panel/40 flex flex-col gap-1 max-w-[90%]">
                    <span className="text-[11.5px] font-[700] text-fg">HTTP POST Payload</span>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Fires a JSON object with full lead details immediately when a lead is captured.
                    </p>
                  </div>
                }
              >
                <div className="flex flex-col gap-3">
                  <div className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border transition-colors",
                    webhook ? "bg-good/5 border-good/20 text-good" : "bg-surface border-border text-muted"
                  )}>
                    <div className="flex items-center gap-2">
                      {webhook ? <CheckIcon className="w-4 h-4 text-good" /> : <div className="w-4 h-4 rounded-full border border-current opacity-50" />}
                      <span className="text-[12.5px] font-[600]">{webhook ? "Connected & Active" : "Not configured"}</span>
                    </div>

                    {webhook && (
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={testingWebhook}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-panel text-fg font-[650] text-xs transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {testingWebhook ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Testing...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span>Test Webhook</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {webhookTestResult && (
                    <div className={cn(
                      "p-3 rounded-xl border text-[12px] font-[600] flex items-center gap-2 animate-fade-in",
                      webhookTestResult.ok ? "bg-good/10 border-good/25 text-good" : "bg-bad/10 border-bad/25 text-bad"
                    )}>
                      {webhookTestResult.ok ? <CheckIcon className="w-4 h-4" /> : <AlertTriangleIcon className="w-4 h-4" />}
                      <span>{webhookTestResult.message}</span>
                    </div>
                  )}

                  <input
                    type="url"
                    value={webhook}
                    onChange={(e) => setWebhook(e.target.value)}
                    placeholder="https://api.yourcompany.com/webhook or Zapier Catch Hook"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-mono text-fg outline-none focus:border-accent transition-colors hover:border-border-strong"
                  />

                  {/* Collapsible JSON Schema Preview */}
                  <div className="rounded-xl border border-border bg-panel/30 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowPayloadPreview(!showPayloadPreview)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-[12px] font-[650] text-fg hover:bg-panel/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-accent" />
                        <span>View Sample JSON Payload</span>
                      </div>
                      {showPayloadPreview ? <ChevronUp className="w-3.5 h-3.5 text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-muted" />}
                    </button>

                    {showPayloadPreview && (
                      <div className="p-3 border-t border-border bg-surface/80 flex flex-col gap-2 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-[600] text-muted">Payload sent via HTTP POST:</span>
                          <button
                            type="button"
                            onClick={handleCopyPayload}
                            className="flex items-center gap-1 text-[11px] font-[650] text-accent hover:underline cursor-pointer"
                          >
                            {copiedPayload ? <LucideCheck className="w-3 h-3 text-good" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedPayload ? "Copied" : "Copy Payload"}</span>
                          </button>
                        </div>
                        <pre className="p-3 rounded-lg bg-panel border border-border text-[11px] font-mono text-fg overflow-x-auto leading-relaxed">
                          {samplePayload}
                        </pre>
                      </div>
                    )}
                  </div>

                  <p className="text-[12px] text-muted ml-1">
                    Save changes below to activate this webhook. Compatible with Zapier, Make.com, HubSpot, and custom servers.
                  </p>
                </div>
              </SettingRow>

              <SettingRow 
                title="Google Sheets Live Sync" 
                description="Stream leads directly into a Google Sheet using an Apps Script Web App URL."
                badge={
                  <div className="mt-2 p-3 rounded-xl border border-border bg-panel/40 flex flex-col gap-1 max-w-[90%]">
                    <span className="text-[11.5px] font-[700] text-fg">Free Team CRM</span>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Share live leads with sales reps or clients directly in a Google Spreadsheet.
                    </p>
                  </div>
                }
              >
                <div className="flex flex-col gap-3">
                  <div className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border transition-colors",
                    googleSheets ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-surface border-border text-muted"
                  )}>
                    <div className="flex items-center gap-2">
                      {googleSheets ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-current opacity-50" />}
                      <span className="text-[12.5px] font-[600]">{googleSheets ? "Connected & Active" : "Not configured"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSheetsModal(true)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-panel text-fg font-[650] text-xs transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      {googleSheets ? "Open Setup & Test" : "Set Up Google Sheets"}
                    </button>
                  </div>
                  <input
                    type="url"
                    value={googleSheets}
                    onChange={(e) => setGoogleSheets(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-mono text-fg outline-none focus:border-accent transition-colors hover:border-border-strong"
                  />
                  <p className="text-[12px] text-muted ml-1">
                    Use our guided wizard above to copy the script, deploy your sheet, test connection, or backfill historic leads.
                  </p>
                </div>
              </SettingRow>

            </div>
          )}


          {/* ================= ACCOUNT & PRIVACY TAB ================= */}
          {activeTab === "account" && (
            <div className="animate-fade-in flex flex-col">
              
              <SettingRow 
                title="Change Password" 
                description="Update the password used to log into your dashboard and manage bot settings."
                badge={
                  <div className="mt-3 p-3.5 rounded-xl border border-border bg-panel/40 flex flex-col gap-1.5 max-w-[92%]">
                    <div className="flex items-center gap-1.5 text-[12px] font-[700] text-good">
                      <CheckIcon className="w-3.5 h-3.5 text-good" />
                      <span>Security Standard</span>
                    </div>
                    <p className="text-[11.5px] text-muted leading-relaxed">
                      All credentials are encrypted. Updating your password will sign out other active sessions for protection.
                    </p>
                  </div>
                }
              >
                <ChangePasswordSection />
              </SettingRow>

              <SettingRow 
                title="Delete Account" 
                description="Permanently delete your account and all associated bots, leads, and chat history. This action cannot be undone."
              >
                <div className="p-5 rounded-xl border border-bad/20 bg-bad/5 flex flex-col gap-3.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangleIcon className="text-bad w-4 h-4" />
                    <span className="text-[13.5px] font-[750] text-bad">Permanent Account Deletion</span>
                  </div>
                  <p className="text-[12.5px] text-fg/80 leading-relaxed">
                    Deleting your account will immediately destroy all bots, training documents, leads, and analytics. There is no recovery.
                  </p>
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Type DELETE to confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full rounded-xl border border-bad/30 bg-surface px-4 py-2.5 text-[13px] font-mono text-fg outline-none focus:border-bad placeholder:text-muted/50 transition-colors"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount || deleteConfirmText !== "DELETE"}
                        className="px-5 py-2.5 rounded-xl bg-bad text-white font-[750] text-[12.5px] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E03A3A] shadow-sm cursor-pointer"
                      >
                        {deletingAccount ? "Deleting..." : "Permanently Delete Account"}
                      </button>
                      {deleteError && <span className="text-[12px] font-[600] text-bad animate-fade-in">{deleteError}</span>}
                    </div>
                  </div>
                </div>
              </SettingRow>

            </div>
          )}

        </div>
        
        {/* Sticky Save Bar (only for General and Integrations) */}
        {(activeTab === "general" || activeTab === "integrations") && (
          <div className="bg-panel/50 border-t border-border px-6 md:px-8 py-4 flex items-center justify-between">
            <span className="text-[13px] text-muted">
              {integrationMsg ? (
                <span className="flex items-center gap-2 text-fg font-[500] animate-fade-in">
                  <CheckIcon className="w-4 h-4 text-good" />
                  {integrationMsg}
                </span>
              ) : (
                "Unsaved changes will be lost if you leave this page."
              )}
            </span>
            <button
              onClick={handleSaveIntegrations}
              className="px-6 py-2 bg-accent text-white rounded-lg text-[13px] font-[700] hover:bg-accent-hover transition-all shadow-sm hover:shadow-md"
            >
              Save changes
            </button>
          </div>
        )}
      </div>

      {showSheetsModal && bot && (
        <GoogleSheetsSyncModal
          isOpen={showSheetsModal}
          onClose={() => setShowSheetsModal(false)}
          onSaved={(newUrl) => setGoogleSheets(newUrl)}
          bot={bot}
        />
      )}
    </div>
  );
}
