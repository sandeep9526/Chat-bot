"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check as CheckIcon, ArrowRight, Loader2 as SpinnerIcon, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { useSubmitLead } from "@/hooks/useOchreshiftApi";
import { useOchreshiftStore } from "@/stores/ochreshiftStore";
import { BOT_ID } from "@/lib/defaults";
import type { FormFieldSchema } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A dashed bottom rule that turns accent on focus (the "form line" look). */
const TICKET_INPUT =
  "w-full border-0 border-b-[1.5px] border-dashed border-paper-rule bg-transparent px-[2px] py-[7px] font-ui text-[13.5px] text-fg outline-none focus:border-accent transition-colors";

/** Perforated tear-strip drawn along the ticket's top and bottom edges. */
const PERFORATION =
  "absolute left-0 right-0 h-[10px] bg-[radial-gradient(circle_at_6px_50%,var(--surface)_3.5px,transparent_4px)] bg-[length:14px_10px] bg-repeat-x";

type Phase = "idle" | "sending" | "sent" | "gone" | "error";

const DEFAULT_FIELDS: FormFieldSchema[] = [
  { id: "name", label: "Full Name", type: "text", required: true, system: true },
  { id: "email", label: "Email Address", type: "email", required: true, system: true },
  { id: "phone", label: "Phone Number", type: "tel", required: false, system: false },
  { id: "message", label: "How can we help you?", type: "textarea", required: false, system: false },
];

interface LeadTicketProps {
  botName: string;
  botId?: string;
  isTest?: boolean;
  initialFields?: FormFieldSchema[];
  onDone: (leadName: string) => void;
}

export function LeadTicket({ botName, botId: propBotId, isTest: propIsTest, initialFields, onDone }: LeadTicketProps) {
  const storeBotId = useOchreshiftStore((s) => s.botId);
  const activeBotId = propBotId || storeBotId || BOT_ID;
  const isTestMode = Boolean(propIsTest || activeBotId === "preview" || activeBotId.startsWith("demo-"));

  const [fields, setFields] = useState<FormFieldSchema[]>(() =>
    initialFields && initialFields.length > 0 ? initialFields : DEFAULT_FIELDS
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [emailTouched, setEmailTouched] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const submitLead = useSubmitLead();
  const qc = useQueryClient();

  // Sync if initialFields updates
  useEffect(() => {
    if (initialFields && initialFields.length > 0) {
      setFields(initialFields);
    }
  }, [initialFields]);

  // Load custom form schema configured for this bot (only when initialFields was not provided)
  useEffect(() => {
    if (initialFields && initialFields.length > 0) return;
    async function loadSchema() {
      if (!activeBotId || activeBotId === "preview") return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${apiUrl}/config?botId=${encodeURIComponent(activeBotId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.formSchema && Array.isArray(data.formSchema) && data.formSchema.length > 0) {
            setFields(data.formSchema);
          }
        }
      } catch (err) {
        console.warn("[LeadTicket] Couldn't load custom form schema:", err);
      }
    }
    loadSchema();
  }, [activeBotId, initialFields]);

  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const setFieldValue = (id: string, val: string) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  };

  // Dynamic validity checks based on rendered schema
  const isValid = useMemo(() => {
    for (const f of fields) {
      const val = (values[f.id] || "").trim();
      if (f.required && !val) {
        return false;
      }
      if (f.type === "email" && val && !EMAIL_RE.test(val)) {
        return false;
      }
    }
    return true;
  }, [fields, values]);

  // Find primary email for validation display
  const primaryEmailField = fields.find((f) => f.type === "email") || fields[1];
  const emailVal = (primaryEmailField && values[primaryEmailField.id]) || "";
  const showEmailError = emailTouched && emailVal.trim().length > 0 && !EMAIL_RE.test(emailVal.trim());
  const locked = phase === "sending" || phase === "sent" || phase === "gone";
  const canSubmit = isValid && !locked;

  // Focus the first field when the ticket appears.
  useEffect(() => {
    const t = setTimeout(() => firstInputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [fields]);

  // Clear any in-flight animation timers on unmount.
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    // Find name, email, phone, message from values
    let leadName = "";
    let leadEmail = "";
    let leadPhone = "";
    let leadMessage = "";
    const customData: Record<string, any> = {};

    for (const f of fields) {
      const val = (values[f.id] || "").trim();
      if (f.id === "name" || f.label.toLowerCase().includes("name")) {
        if (!leadName) leadName = val;
      } else if (f.type === "email" || f.id === "email" || f.label.toLowerCase().includes("email")) {
        if (!leadEmail) leadEmail = val;
      } else if (f.type === "tel" || f.id === "phone" || f.label.toLowerCase().includes("phone")) {
        if (!leadPhone) leadPhone = val;
      } else if (f.id === "message" || f.label.toLowerCase().includes("help") || f.label.toLowerCase().includes("message")) {
        if (!leadMessage) leadMessage = val;
      }
      // Store all fields with their clear labels in custom_data
      if (val) {
        customData[f.label] = val;
      }
    }

    if (!leadName) leadName = Object.values(values)[0] || "Customer";
    if (!leadEmail) leadEmail = "lead@visitor.com";

    if (isTestMode) {
      customData["is_test"] = true;
    }

    setPhase("sending");
    try {
      const res = await submitLead.mutateAsync({
        name: leadName,
        email: leadEmail,
        phone: leadPhone || undefined,
        message: leadMessage || undefined,
        botId: activeBotId,
        custom_data: customData,
        isTest: isTestMode,
      });
      if (!res?.ok) throw new Error("Lead submission rejected");

      // Invalidate and refetch immediately so leads show without page reload
      qc.invalidateQueries({ queryKey: ["admin", "leads"] });
      qc.refetchQueries({ queryKey: ["admin", "leads"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      qc.refetchQueries({ queryKey: ["admin", "stats"] });
    } catch {
      setPhase("error");
      return;
    }

    // sent (lift) → gone (slide off) → hand back to parent
    setPhase("sent");
    timers.current.push(
      setTimeout(() => {
        setPhase("gone");
        timers.current.push(
          setTimeout(() => onDone(leadName), reduce ? 0 : 420),
        );
      }, reduce ? 0 : 640),
    );
  }, [canSubmit, fields, values, isTestMode, submitLead, activeBotId, onDone, reduce]);

  return (
    <div
      className={cn(
        "relative rounded-r1 border border-paper-rule bg-paper px-4 py-4",
        "shadow-card",
        "transition-all duration-[450ms] ease-out",
        phase === "sent" && "-translate-y-2 -rotate-1",
        phase === "gone" && "translate-y-[30px] scale-90 opacity-0",
      )}
    >
      <div className={cn(PERFORATION, "-top-[5px]")} />
      <div className={cn(PERFORATION, "-bottom-[5px]")} />

      <div className="flex items-center justify-between gap-2">
        <h4 className="m-0 font-mono text-[10.5px] font-[700] uppercase tracking-[.14em] text-faint truncate">
          {botName} · handoff
        </h4>
        {isTestMode && (
          <span className="shrink-0 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 font-mono text-[9px] font-[750] uppercase text-amber-600 dark:text-amber-400">
            Preview Test
          </span>
        )}
      </div>

      <div className="mb-3 mt-1 text-[13.5px] font-[650] text-fg">
        Leave your details and the team will reach out.
      </div>

      <div className="flex flex-col gap-2.5">
        {fields.map((f, i) => {
          const val = values[f.id] || "";
          const isEmail = f.type === "email";

          if (f.type === "dropdown" && f.options && f.options.length > 0) {
            return (
              <div key={f.id} className="relative">
                <select
                  className={cn(
                    TICKET_INPUT,
                    "cursor-pointer appearance-none pr-6 bg-transparent",
                    !val ? "text-muted" : "text-fg font-medium"
                  )}
                  value={val}
                  disabled={locked}
                  required={f.required}
                  aria-label={f.label}
                  onChange={(e) => setFieldValue(f.id, e.target.value)}
                >
                  <option value="" disabled className="bg-surface text-muted">
                    {f.label}{f.required ? "" : " (optional)"}
                  </option>
                  {f.options.map((opt) => (
                    <option key={opt} value={opt} className="bg-surface text-fg">
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              </div>
            );
          }

          if (f.type === "textarea") {
            return (
              <textarea
                key={f.id}
                className={cn(TICKET_INPUT, "resize-none leading-relaxed")}
                rows={2}
                placeholder={f.label + (f.required ? "" : " (optional)")}
                aria-label={f.label}
                required={f.required}
                disabled={locked}
                value={val}
                onChange={(e) => setFieldValue(f.id, e.target.value)}
              />
            );
          }

          return (
            <div key={f.id} className="flex flex-col">
              <input
                ref={i === 0 ? firstInputRef : undefined}
                className={cn(TICKET_INPUT, isEmail && showEmailError && "border-bad")}
                type={f.type || "text"}
                placeholder={f.label + (f.required ? "" : " (optional)")}
                aria-label={f.label}
                aria-invalid={isEmail && showEmailError}
                required={f.required}
                disabled={locked}
                value={val}
                onChange={(e) => setFieldValue(f.id, e.target.value)}
                onBlur={() => isEmail && setEmailTouched(true)}
              />
              {isEmail && showEmailError && (
                <p role="alert" className="mt-1 text-[11px] leading-[1.3] text-bad">
                  That doesn&apos;t look like a valid email — double check it?
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className={cn(
          "mt-3.5 w-full rounded-r1 border-none py-[10.5px] font-ui text-[13.5px] font-[700] text-[var(--on-accent)]",
          "cursor-pointer bg-accent transition-opacity active:scale-[0.99]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          !canSubmit && "cursor-not-allowed opacity-40",
        )}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {phase === "sent" || phase === "gone" ? (
          <span className="inline-flex items-center gap-1">Sent <CheckIcon className="h-3.5 w-3.5" /></span>
        ) : phase === "sending" ? (
          <span className="inline-flex items-center gap-1">
            Sending… <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
          </span>
        ) : phase === "error" ? (
          <span className="inline-flex items-center gap-1">Try again <ArrowRight className="h-3.5 w-3.5" /></span>
        ) : (
          <span className="inline-flex items-center gap-1">Send my details <ArrowRight className="h-3.5 w-3.5" /></span>
        )}
      </button>

      {phase === "error" && (
        <p role="alert" className="mt-2 text-[12px] leading-[1.4] text-bad text-center">
          Couldn&apos;t send your details — check your connection and try again.
        </p>
      )}
    </div>
  );
}

export function LeadStub() {
  return (
    <div className="flex items-center gap-2.5 rounded-r2 border border-[color-mix(in_srgb,var(--good)_30%,transparent)] bg-[color-mix(in_srgb,var(--good)_12%,var(--surface))] px-[14px] py-3 text-[13px]">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-good text-white shadow-sm">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
      <div>
        <b className="text-fg">Thanks — we&rsquo;ll be in touch soon.</b>
      </div>
    </div>
  );
}
