"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Check, AlertCircle, List, FileText, CheckSquare, Settings2, Sparkles, MoveUp, MoveDown } from "lucide-react";

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
  const [fields, setFields] = useState<FormFieldSchema[]>(DEFAULT_FIELDS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);

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
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-r1 bg-indigo-500/15 text-indigo-600">
            <Settings2 className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <b className="text-[14px] font-[750] text-fg">Lead form fields</b>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 px-2 py-0.5 text-[10.5px] font-[700]">
                <Sparkles className="h-3 w-3" /> Custom
              </span>
            </div>
            <p className="text-[11.5px] text-muted">
              Add extra fields to capture visitor data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 rounded-r1 border border-border bg-surface hover:bg-panel text-fg font-[700] px-3.5 py-2 text-[12.5px] transition-colors shadow-2xs"
          >
            <Plus className="h-4 w-4 text-indigo-600" />
            Add field
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-1.5 rounded-r1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-[700] px-4 py-2 text-[12.5px] transition-colors shadow-2xs"
          >
            {saving ? "Saving…" : "Save fields"}
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="mb-4 rounded-r1 bg-emerald-500/15 border border-emerald-500/30 p-3 text-[13px] font-[650] text-emerald-700 flex items-center gap-2 animate-fadeIn">
          <Check className="h-4 w-4 text-emerald-600" />
          Saved — your lead form is updated.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-r1 bg-bad/10 border border-bad/30 p-3 text-[13px] font-[650] text-bad flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Add Custom Field Box */}
      {showAdd && (
        <form onSubmit={handleAddField} className="mb-6 bg-surface p-4 rounded-r1 border border-indigo-500/30 space-y-3.5">
          <b className="block text-[13.5px] font-[750] text-fg">Add a field</b>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11.5px] font-[700] text-muted mb-1">Field label</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Desired Budget or Property Location"
                required
                className="w-full rounded-r1 border border-border bg-panel px-3 py-1.5 text-[13px] text-fg focus:border-indigo-500 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-[700] text-muted mb-1">Field type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full rounded-r1 border border-border bg-panel px-3 py-1.5 text-[13px] text-fg focus:border-indigo-500 outline-none font-medium"
              >
                <option value="text">Text</option>
                <option value="dropdown">Dropdown</option>
                <option value="textarea">Long text</option>
              </select>
            </div>
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] font-[650] text-fg select-none">
                <input
                  type="checkbox"
                  checked={newRequired}
                  onChange={(e) => setNewRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
                />
                Required
              </label>
            </div>
          </div>

          {newType === "dropdown" && (
            <div>
              <label className="block text-[11.5px] font-[700] text-muted mb-1">
                Dropdown options <span className="text-faint">(comma separated)</span>
              </label>
              <input
                type="text"
                value={newOptions}
                onChange={(e) => setNewOptions(e.target.value)}
                placeholder="e.g. Under $5,000, $5,000 to $15,000, Over $15,000"
                required
                className="w-full rounded-r1 border border-border bg-panel px-3 py-1.5 text-[13px] font-mono text-fg focus:border-indigo-500 outline-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 rounded-r1 text-[12.5px] font-[700] text-muted hover:bg-panel transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-r1 bg-indigo-600 hover:bg-indigo-700 text-white font-[700] text-[12.5px] transition-colors shadow-2xs"
            >
Add field
            </button>
          </div>
        </form>
      )}

      {/* Existing Fields Table / List */}
      <div className="rounded-r1 border border-border overflow-hidden bg-surface divide-y divide-border">
        <div className="grid grid-cols-12 bg-panel/70 px-4 py-2.5 text-[11.5px] font-[750] text-faint uppercase tracking-wider">
          <div className="col-span-5 sm:col-span-6">Field</div>
          <div className="col-span-3 sm:col-span-3">Type</div>
          <div className="col-span-4 sm:col-span-3 text-right">Required</div>
        </div>
        {fields.map((f, idx) => (
          <div key={f.id} className="grid grid-cols-12 items-center px-4 py-3 text-[13px] hover:bg-panel/40 transition-colors gap-2">
            <div className="col-span-5 sm:col-span-6 flex items-center gap-2.5 min-w-0">
              {f.type === "dropdown" ? (
                <List className="h-4 w-4 text-indigo-500 shrink-0" />
              ) : f.type === "textarea" ? (
                <FileText className="h-4 w-4 text-amber-500 shrink-0" />
              ) : (
                <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
              <div className="min-w-0">
                <span className="font-[750] text-fg block truncate">
                  {f.label} {f.system && <span className="text-[11px] font-[650] text-indigo-600 font-mono ml-1">(System)</span>}
                </span>
                {f.options && (
                  <span className="text-[11px] font-mono text-muted truncate block">
                    Options: {f.options.join(" | ")}
                  </span>
                )}
              </div>
            </div>
            <div className="col-span-3 sm:col-span-3 font-mono text-[12px] text-muted capitalize">
              {f.type}
            </div>
            <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-3">
              <label className="flex items-center gap-1.5 text-[12px] font-[650] text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={f.required}
                  disabled={f.system}
                  onChange={() => toggleRequired(f.id)}
                  className="h-3.5 w-3.5 rounded border-border text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
                />
                Req
              </label>
              {!f.system ? (
                <button
                  type="button"
                  onClick={() => removeField(f.id)}
                  title="Remove Custom Field"
                  className="p-1 rounded text-bad hover:bg-bad/15 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <span className="w-6 text-center text-faint font-mono text-[10px]">🔒</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
