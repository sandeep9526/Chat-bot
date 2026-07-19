"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useSubmitLead } from "@/hooks/useZevaApi";
import { BOT_ID } from "@/lib/defaults";

/** A dashed bottom rule that turns accent on focus (the "form line" look). */
const TICKET_INPUT =
  "w-full border-0 border-b-[1.5px] border-dashed border-paper-rule bg-transparent px-[2px] py-[7px] font-ui text-[13.5px] text-fg outline-none focus:border-accent";

/** Perforated tear-strip drawn along the ticket's top and bottom edges. */
const PERFORATION =
  "absolute left-0 right-0 h-[10px] bg-[radial-gradient(circle_at_6px_50%,var(--surface)_3.5px,transparent_4px)] bg-[length:14px_10px] bg-repeat-x";

type Phase = "idle" | "sent" | "gone";

interface LeadTicketProps {
  botName: string;
  onDone: (leadName: string) => void;
}

export function LeadTicket({ botName, onDone }: LeadTicketProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const nameRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const submitLead = useSubmitLead();

  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const canSubmit = name.trim().length > 0 && email.trim().length > 0;

  // Focus the first field when the ticket appears.
  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  // Clear any in-flight animation timers on unmount.
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit || phase !== "idle") return;
    const leadName = name.trim();

    // Post the lead (fire-and-forget; the UX doesn't block on the response).
    submitLead.mutate({
      name: leadName,
      email: email.trim(),
      phone: phone.trim() || undefined,
      botId: BOT_ID,
    });

    // sent (lift) → gone (slide off) → hand back to the parent for the stub.
    setPhase("sent");
    timers.current.push(
      setTimeout(() => {
        setPhase("gone");
        timers.current.push(
          setTimeout(() => onDone(leadName), reduce ? 0 : 420),
        );
      }, reduce ? 0 : 640),
    );
  }, [canSubmit, phase, name, email, phone, submitLead, onDone, reduce]);

  return (
    <div
      className={cn(
        "relative rounded-r1 border border-paper-rule bg-paper px-4 py-4",
        "shadow-[0_10px_26px_-12px_rgba(30,41,90,.35)]",
        "transition-all duration-[450ms] ease-out",
        phase === "sent" && "-translate-y-2 -rotate-1",
        phase === "gone" && "translate-y-[30px] scale-90 opacity-0",
      )}
    >
      <div className={cn(PERFORATION, "-top-[5px]")} />
      <div className={cn(PERFORATION, "-bottom-[5px]")} />

      <span className="absolute right-3 top-3 rotate-[9deg] rounded-[6px] border-2 border-accent px-[7px] py-[3px] font-mono text-[10px] font-[800] tracking-[.1em] text-accent opacity-85">
        WARM LEAD
      </span>

      <h4 className="m-0 font-mono text-[10.5px] font-[700] uppercase tracking-[.14em] text-faint">
        {botName} · handoff
      </h4>
      <div className="mb-3 mt-1 text-[13.5px] font-[650]">
        Leave your details and the team will reach out.
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={nameRef}
          className={TICKET_INPUT}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={TICKET_INPUT}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={TICKET_INPUT}
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <button
        type="button"
        className={cn(
          "mt-3 w-full rounded-r1 border-none py-[11px] font-ui text-[13.5px] font-[700] text-white",
          "cursor-pointer bg-accent transition-opacity",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          !canSubmit && "cursor-not-allowed opacity-40",
        )}
        disabled={!canSubmit || phase !== "idle"}
        onClick={handleSubmit}
      >
        {phase === "sent" ? "Sent ✓" : "Hand me to the team →"}
      </button>
    </div>
  );
}

interface LeadStubProps {
  name: string;
}

export function LeadStub({ name }: LeadStubProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-r2 border border-[color-mix(in_srgb,var(--good)_30%,transparent)] bg-[color-mix(in_srgb,var(--good)_12%,var(--surface))] px-[14px] py-3 text-[13px]">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-good text-white">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
      <div>
        <b>Handed to the team.</b>
        <small className="mt-0.5 block text-[11.5px] text-muted">
          {name} — marked a warm lead.
        </small>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
