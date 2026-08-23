"use client";

import { useState, useEffect } from "react";
import type { AdminBot } from "@/lib/adminApi";
import { exportTenantData, executeSubjectErasure } from "@/lib/adminApi";
import { submitLead } from "@/lib/api";
import { useCreateBot } from "@/hooks/useAdmin";
import { authClient, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/panel/AppShell";

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

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-4 h-4", className)}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
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
  const [botName, setBotName] = useState(bot?.name ?? "");
  const [modelOverride, setModelOverride] = useState(bot?.model_override ?? "");
  const [customPromptStyle, setCustomPromptStyle] = useState(bot?.custom_prompt_style ?? "");
  const [domains, setDomains] = useState((bot?.allowed_domains ?? ["*"]).join(", "));
  
  // Integrations State
  const [notifEmail, setNotifEmail] = useState(bot?.notification_email ?? "");
  const [webhook, setWebhook] = useState(bot?.webhook_url ?? "");
  const [googleSheets, setGoogleSheets] = useState(bot?.google_sheets_url ?? "");
  const [whatsappId, setWhatsappId] = useState(bot?.whatsapp_phone_number_id ?? "");
  
  // UI State
  const [integrationMsg, setIntegrationMsg] = useState("");
  const [testAlertMsg, setTestAlertMsg] = useState("");
  const [testingAlert, setTestingAlert] = useState(false);
  
  // Account State
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passError, setPassError] = useState("");
  const [changingPass, setChangingPass] = useState(false);
  
  const [exportingData, setExportingData] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  
  const [erasureIdentifier, setErasureIdentifier] = useState("");
  const [erasureLoading, setErasureLoading] = useState(false);
  const [erasureMsg, setErasureMsg] = useState("");
  
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (bot) {
      setBotName(bot.name ?? "");
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
        name: botName,
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
      setIntegrationMsg("Settings saved successfully.");
      setTimeout(() => setIntegrationMsg(""), 4000);
    } catch (e: any) {
      setIntegrationMsg("Couldn't save settings: " + (e?.message || "Unknown error"));
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
        setTestAlertMsg("Test alert sent — check your email, webhook, and spreadsheet.");
      } else {
        setTestAlertMsg("Couldn't send the test alert.");
      }
    } catch (e: any) {
      setTestAlertMsg("Couldn't send the test alert: " + (e?.message || "Error"));
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
      a.download = `zeva_gdpr_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setExportMsg("Couldn't export your data: " + (e?.message || "Unknown error"));
      setTimeout(() => setExportMsg(""), 6000);
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
      setErasureMsg(`Deleted ${res.purged?.leads ?? 0} lead(s) and ${res.purged?.chats ?? 0} chat record(s).`);
      setErasureIdentifier("");
    } catch (err: any) {
      setErasureMsg("Couldn't delete this person's data: " + (err?.message || "Server error"));
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

  // Reusable component for a settings row
  const SettingRow = ({ title, description, children }: { title: string, description: string, children: React.ReactNode }) => (
    <div className="flex flex-col lg:flex-row gap-6 py-6 border-b border-border last:border-0">
      <div className="lg:w-1/3 flex flex-col gap-1.5 shrink-0">
        <h4 className="text-[14px] font-[750] text-fg">{title}</h4>
        <p className="text-[13px] text-muted leading-relaxed max-w-[90%]">{description}</p>
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
                title="Agent Identity" 
                description="Your agent's core identity. To change how it looks, visit the Studio."
              >
                <div className="flex flex-col gap-4 bg-panel/50 p-5 rounded-xl border border-border">
                  <div className="grid grid-cols-[100px_1fr] gap-y-3 text-[13px]">
                    <span className="text-muted mt-1.5">Name</span>
                    <input 
                      type="text" 
                      value={botName} 
                      onChange={(e) => setBotName(e.target.value)} 
                      className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] font-[600] text-fg outline-none focus:border-accent"
                    />
                    <span className="text-muted">Bot ID</span>
                    <span className="font-mono text-[12px] text-fg">{bot?.bot_id ?? "—"}</span>
                    <span className="text-muted">Accent</span>
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border border-border" style={{ background: bot?.accent }} />
                      <span className="font-mono text-[12px] text-fg">{bot?.accent ?? "—"}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onGoto ? onGoto("appearance") : (window.location.hash = "appearance")}
                    className="self-start inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12.5px] font-[650] text-fg hover:border-accent transition-colors"
                  >
                    Customize in Studio
                    <ExternalLinkIcon className="h-3 w-3 text-muted" />
                  </button>
                </div>
              </SettingRow>

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
              
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 my-6 flex gap-3 items-start">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-white">
                  <CheckIcon className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="text-[13px] font-[750] text-accent">Test your integrations</h4>
                  <p className="text-[12.5px] text-muted mt-1 leading-relaxed">
                    Make sure your webhooks and spreadsheets are wired up correctly by sending a mock lead.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={handleSendTestAlert}
                      disabled={testingAlert}
                      className="px-4 py-1.5 bg-accent text-white text-[12.5px] font-[650] rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {testingAlert ? "Sending..." : "Send test alert"}
                    </button>
                    {testAlertMsg && (
                      <span className="text-[12.5px] font-[600] text-good animate-fade-in">{testAlertMsg}</span>
                    )}
                  </div>
                </div>
              </div>

              <SettingRow 
                title="Email Notifications" 
                description="Receive an email instantly whenever a lead provides their contact info."
              >
                <div className="flex flex-col gap-3">
                  <div className={cn("flex items-center gap-2 p-3 rounded-xl border transition-colors", notifEmail ? "bg-good/5 border-good/20 text-good" : "bg-surface border-border text-muted")}>
                    {notifEmail ? <CheckIcon className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current opacity-50" />}
                    <span className="text-[12.5px] font-[600]">{notifEmail ? "Connected & Active" : "Not configured"}</span>
                  </div>
                  <input
                    type="email"
                    value={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.value)}
                    placeholder="sales@yourcompany.com"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] text-fg outline-none focus:border-accent transition-colors hover:border-border-strong"
                  />
                  <p className="text-[12px] text-muted ml-1">Click "Save changes" at the bottom to update your email.</p>
                </div>
              </SettingRow>

              <SettingRow 
                title="Webhook URL" 
                description="We'll POST a JSON payload to this URL when a chat finishes or a lead is captured."
              >
                <div className="flex flex-col gap-3">
                  <div className={cn("flex items-center gap-2 p-3 rounded-xl border transition-colors", webhook ? "bg-good/5 border-good/20 text-good" : "bg-surface border-border text-muted")}>
                    {webhook ? <CheckIcon className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current opacity-50" />}
                    <span className="text-[12.5px] font-[600]">{webhook ? "Connected & Active" : "Not configured"}</span>
                  </div>
                  <input
                    type="url"
                    value={webhook}
                    onChange={(e) => setWebhook(e.target.value)}
                    placeholder="https://api.example.com/webhook"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-mono text-fg outline-none focus:border-accent transition-colors hover:border-border-strong"
                  />
                  <p className="text-[12px] text-muted ml-1">Save changes below to activate this webhook.</p>
                </div>
              </SettingRow>

              <SettingRow 
                title="Google Sheets" 
                description="Sync leads directly into a Google Sheet using an Apps Script Web App URL."
              >
                <div className="flex flex-col gap-3">
                  <div className={cn("flex items-center gap-2 p-3 rounded-xl border transition-colors", googleSheets ? "bg-good/5 border-good/20 text-good" : "bg-surface border-border text-muted")}>
                    {googleSheets ? <CheckIcon className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current opacity-50" />}
                    <span className="text-[12.5px] font-[600]">{googleSheets ? "Connected & Active" : "Not configured"}</span>
                  </div>
                  <input
                    type="url"
                    value={googleSheets}
                    onChange={(e) => setGoogleSheets(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-mono text-fg outline-none focus:border-accent transition-colors hover:border-border-strong"
                  />
                  <p className="text-[12px] text-muted ml-1">Make sure your Apps Script URL starts with https://script.google.com/.</p>
                </div>
              </SettingRow>

              <SettingRow 
                title="WhatsApp Integration" 
                description="Connect your WhatsApp Business Phone Number ID to allow handoffs to WhatsApp."
              >
                <div className="flex flex-col gap-3">
                  <div className={cn("flex items-center gap-2 p-3 rounded-xl border transition-colors", whatsappId ? "bg-good/5 border-good/20 text-good" : "bg-surface border-border text-muted")}>
                    {whatsappId ? <CheckIcon className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current opacity-50" />}
                    <span className="text-[12.5px] font-[600]">{whatsappId ? "Connected & Active" : "Not configured"}</span>
                  </div>
                  <input
                    type="text"
                    value={whatsappId}
                    onChange={(e) => setWhatsappId(e.target.value)}
                    placeholder="e.g. 102938475610293"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-mono text-fg outline-none focus:border-accent transition-colors hover:border-border-strong"
                  />
                  <p className="text-[12px] text-muted ml-1">Enter your Business Phone Number ID from the Meta Developer dashboard.</p>
                </div>
              </SettingRow>
            </div>
          )}


          {/* ================= ACCOUNT & PRIVACY TAB ================= */}
          {activeTab === "account" && (
            <div className="animate-fade-in flex flex-col">
              
              <SettingRow 
                title="Change Password" 
                description="Update the password used to log into your dashboard."
              >
                <form onSubmit={handleChangePassword} className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-panel/30">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-[13px] text-fg outline-none focus:border-accent"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-[13px] text-fg outline-none focus:border-accent"
                  />
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="submit"
                      disabled={changingPass}
                      className="px-4 py-2 bg-accent text-white rounded-lg text-[12.5px] font-[700] hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      {changingPass ? "Updating..." : "Update Password"}
                    </button>
                    {passError && <span className="text-[12px] font-[600] text-bad animate-fade-in">{passError}</span>}
                    {passMsg && <span className="text-[12px] font-[600] text-good animate-fade-in">{passMsg}</span>}
                  </div>
                </form>
              </SettingRow>

              <SettingRow 
                title="Export Data" 
                description="Download a GDPR-compliant JSON bundle containing all your bots, leads, and chat history."
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={exportingData}
                    className="px-4 py-2 rounded-lg border border-border bg-surface hover:bg-panel text-[13px] font-[650] text-fg transition-colors disabled:opacity-50"
                  >
                    {exportingData ? "Bundling data..." : "Download Export (.json)"}
                  </button>
                  {exportMsg && <span className="text-[12px] font-[500] text-muted animate-fade-in">{exportMsg}</span>}
                </div>
              </SettingRow>

              <SettingRow 
                title="GDPR Data Erasure" 
                description="Permanently delete all leads and chat history associated with a specific email or phone number."
              >
                <form onSubmit={handleErasureRequest} className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Email or phone to erase"
                      value={erasureIdentifier}
                      onChange={(e) => setErasureIdentifier(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-[13px] text-fg outline-none focus:border-bad"
                    />
                    <button
                      type="submit"
                      disabled={erasureLoading || !erasureIdentifier.trim()}
                      className="px-4 py-2 rounded-lg bg-bad/10 text-bad hover:bg-bad/20 font-[650] text-[13px] transition-colors disabled:opacity-50"
                    >
                      Erase
                    </button>
                  </div>
                  {erasureMsg && <span className="text-[12px] font-[500] text-muted animate-fade-in">{erasureMsg}</span>}
                </form>
              </SettingRow>

              {/* Danger Zone */}
              <div className="mt-8 mb-6 p-6 rounded-2xl border-2 border-bad/20 bg-bad/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangleIcon className="text-bad" />
                  <h4 className="text-[15px] font-[800] text-bad">Danger Zone</h4>
                </div>
                <p className="text-[13px] text-fg/80 mb-6">
                  Deleting your account is permanent. It will instantly destroy all bots, leads, and chat history. There is no undo.
                </p>
                <div className="flex flex-col gap-3 max-w-sm">
                  <input
                    type="text"
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full rounded-lg border border-bad/30 bg-surface px-4 py-2.5 text-[13px] font-mono text-fg outline-none focus:border-bad placeholder:text-muted/50"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount || deleteConfirmText !== "DELETE"}
                      className="px-5 py-2.5 rounded-lg bg-bad text-white font-[750] text-[13px] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E03A3A] shadow-[0_0_15px_-5px_rgba(255,0,0,0.5)]"
                    >
                      {deletingAccount ? "Deleting..." : "Permanently Delete Account"}
                    </button>
                    {deleteError && <span className="text-[12px] font-[600] text-bad">{deleteError}</span>}
                  </div>
                </div>
              </div>
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
    </div>
  );
}
