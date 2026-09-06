"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check, AlertCircle, List, FileText, CheckSquare, Settings2, Sparkles, MoveUp, MoveDown, FlaskConical, X } from "lucide-react";
import { LeadTicket } from "@/components/widget/LeadTicket";
import { useOchreshiftStore } from "@/stores/ochreshiftStore";

export interface FormFieldSchema {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "dropdown";
  required: boolean;
  options?: string[];
  system?: boolean;
}

const DEFAULT_FIELDS: FormFieldSchema[] = [
  { id: "name", label: "Full Name", type: "text", required: true, system: true },
  { id: "email", label: "Email Address", type: "email", required: true, system: true },
  { id: "phone", label: "Phone Number", type: "tel", required: false, system: false },
  { id: "message", label: "How can we help you?", type: "textarea", required: false, system: false },
];

interface LeadFormBuilderProps {
  botId: string;
}

export function LeadFormBuilder({ botId }: LeadFormBuilderProps) {
  const qc = useQueryClient();
  const storeBotId = useOchreshiftStore((s) => s.botId);
  const activeBotId = botId || storeBotId || "";
  const [fields, setFields] = useState<FormFieldSchema[]>(DEFAULT_FIELDS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // New Field modal state
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<"text" | "dropdown" | "textarea">("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    async function loadSchema() {
      if (!botId) return;
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/config?botId=${encodeURIComponent(botId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.formSchema && Array.isArray(data.formSchema) && data.formSchema.length > 0) {
            setFields(data.formSchema);
          } else {
            setFields(DEFAULT_FIELDS);
          }
        }
      } catch (err) {
        console.error("Failed to load bot form schema:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSchema();
  }, [botId, apiUrl]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSavedMsg(false);
    try {
      const res = await fetch(`${apiUrl}/admin/form-schema`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, formSchema: fields }),
      });
      if (!res.ok) throw new Error("We couldn't save your changes — try again.");
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3500);
    } catch (err: any) {
      setError(err.message || "We couldn't save your changes — try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const id = newLabel.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Math.floor(Math.random() * 1000);
    const opts = newType === "dropdown" ? newOptions.split(",").map((o) => o.trim()).filter(Boolean) : undefined;

    const newField: FormFieldSchema = {
      id,
      label: newLabel.trim(),
      type: newType,
      required: newRequired,
      options: opts && opts.length > 0 ? opts : ["Option 1", "Option 2"],
      system: false,
    };

    setFields([...fields, newField]);
    setShowAdd(false);
    setNewLabel("");
    setNewOptions("");
    setNewRequired(false);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id || f.system));
  };

  const toggleRequired = (id: string) => {
    setFields(
      fields.map((f) => {
        if (f.id === id && !f.system) {
          return { ...f, required: !f.required };
        }
        return f;
      })
    );
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-surface shadow-sm overflow-hidden min-h-[540px] flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 bg-panel/40">
        <div>
          <h3 className="text-[15px] font-[800] text-fg tracking-tight flex items-center gap-2">
            Lead Capture Form Fields
            <span className="bg-accent/10 text-accent text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Custom
            </span>
          </h3>
          <p className="text-[12px] text-muted mt-0.5">
            Configure the questions and contact details your agent asks visitors before team handoff
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-[700] px-3.5 py-1.5 text-[12px] transition-all shadow-xs cursor-pointer active:scale-95"
            title="Preview and test submitting your lead form"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>Test Form</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-1.5 text-[12px] font-[700] text-fg hover:bg-panel px-3.5 py-1.5 rounded-xl border border-border transition-colors bg-surface shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 text-faint" />
            <span>Add Field</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-[700] px-4 py-1.5 text-[12px] transition-colors shadow-sm cursor-pointer active:scale-95"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">

        {savedMsg && (
          <div className="mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-[12.5px] font-[650] text-emerald-700 flex items-center gap-2 animate-pulse">
            <Check className="h-4 w-4 text-emerald-600" />
            Saved — your lead form is updated.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-bad/10 border border-bad/30 p-3 text-[12.5px] font-[650] text-bad flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Add Custom Field Modal (Portal mounted to eliminate layout shift) */}
        {showAdd && mounted && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
            onClick={() => setShowAdd(false)}
          >
            <div
              className="w-full max-w-[460px] rounded-2xl border border-border bg-surface shadow-2xl p-6 animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border/70">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-[800] text-fg text-[15px] tracking-tight">Add Custom Form Field</h4>
                    <p className="text-[11.5px] text-muted">Collect additional info from visitors before handoff</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="text-muted hover:text-fg p-1.5 rounded-lg hover:bg-panel cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddField} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-[700] text-muted mb-1.5">Field Question / Label</label>
                  <input
                    autoFocus
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Company Name, Budget, Project Scope"
                    required
                    className="w-full rounded-xl border border-border bg-panel px-3.5 py-2.5 text-[13px] text-fg focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-[700] text-muted mb-1.5">Input Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full rounded-xl border border-border bg-panel px-3.5 py-2.5 text-[13px] text-fg focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none font-medium transition-all cursor-pointer"
                    >
                      <option value="text">Short Text</option>
                      <option value="dropdown">Dropdown Select</option>
                      <option value="textarea">Long Text / Details</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2.5 h-[42px] px-3.5 rounded-xl border border-border bg-panel cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newRequired}
                        onChange={(e) => setNewRequired(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                      />
                      <span className="text-[12.5px] font-[650] text-fg">Required</span>
                    </label>
                  </div>
                </div>

                {newType === "dropdown" && (
                  <div className="animate-fade-in">
                    <label className="block text-[12px] font-[700] text-muted mb-1.5">
                      Dropdown Options <span className="text-faint text-[11px] font-normal">(comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      value={newOptions}
                      onChange={(e) => setNewOptions(e.target.value)}
                      placeholder="e.g. Under $10k, $10k - $50k, $50k+"
                      required
                      className="w-full rounded-xl border border-border bg-panel px-3.5 py-2.5 text-[13px] text-fg focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-4 py-2 rounded-xl border border-border bg-surface hover:bg-panel text-fg font-[700] text-[12.5px] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white font-[700] text-[12.5px] transition-colors shadow-sm cursor-pointer active:scale-95"
                  >
                    Add Field
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Existing Fields Table / List */}
        <div className="rounded-xl border border-border overflow-hidden bg-surface divide-y divide-border shadow-sm">
          <div className="grid grid-cols-[1fr_50px_40px] bg-panel/70 px-3 py-2.5 text-[11px] font-[750] text-faint uppercase tracking-wider gap-2">
            <div>Field</div>
            <div>Type</div>
            <div className="text-right">Req</div>
          </div>
          {fields.map((f, idx) => (
            <div key={f.id} className="grid grid-cols-[1fr_50px_60px] sm:grid-cols-[1fr_60px_70px] items-center px-3 py-3 hover:bg-panel/40 transition-colors gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {f.type === "dropdown" ? (
                  <List className="h-3.5 w-3.5 text-accent shrink-0" />
                ) : f.type === "textarea" ? (
                  <FileText className="h-3.5 w-3.5 text-accent shrink-0" />
                ) : (
                  <CheckSquare className="h-3.5 w-3.5 text-accent shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="font-[650] text-[12.5px] text-fg block truncate">
                    {f.label} {f.system && <span className="text-[10px] font-[650] text-accent font-mono ml-1">(System)</span>}
                  </span>
                  {f.options && (
                    <span className="text-[10px] font-mono text-muted truncate block mt-0.5">
                      {f.options.join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="font-mono text-[11px] text-muted capitalize truncate">
                {f.type}
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <input
                  type="checkbox"
                  checked={f.required}
                  disabled={f.system}
                  onChange={() => toggleRequired(f.id)}
                  className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent disabled:opacity-40 cursor-pointer"
                  title="Required"
                />
                {!f.system ? (
                  <button
                    type="button"
                    onClick={() => removeField(f.id)}
                    title="Remove Custom Field"
                    className="p-1 rounded text-bad hover:bg-bad/15 transition-colors ml-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="w-[26px] text-center text-faint font-mono text-[10px] ml-1">🔒</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {showTestModal && mounted && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
            onClick={() => setShowTestModal(false)}
          >
            <div
              className="w-full max-w-[420px] rounded-2xl border border-purple-500/30 bg-surface shadow-2xl p-5 ring-4 ring-purple-500/10 animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-xs font-[750]">
                    <FlaskConical className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="font-[750] text-fg text-[14px]">Test Lead Capture Form</h4>
                    <p className="text-[11px] text-muted">Preview how your visitors experience your custom fields</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="text-muted hover:text-fg text-xs font-[600] p-1.5 rounded-lg hover:bg-panel cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <LeadTicket
                botName="Assistant"
                botId={activeBotId || "preview"}
                isTest={true}
                initialFields={fields}
                onDone={() => {
                  setShowTestModal(false);
                  qc.invalidateQueries({ queryKey: ["admin", "leads"] });
                  qc.refetchQueries({ queryKey: ["admin", "leads"] });
                  qc.invalidateQueries({ queryKey: ["admin", "stats"] });
                  qc.refetchQueries({ queryKey: ["admin", "stats"] });
                }}
              />
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
