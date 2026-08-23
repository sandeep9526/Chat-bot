"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check as CheckIcon, ArrowRight, Loader2 as SpinnerIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSubmitLead } from "@/hooks/useZevaApi";
import { BOT_ID } from "@/lib/defaults";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A dashed bottom rule that turns accent on focus (the "form line" look). */
const TICKET_INPUT =
  "w-full border-0 border-b-[1.5px] border-dashed border-paper-rule bg-transparent px-[2px] py-[7px] font-ui text-[13.5px] text-fg outline-none focus:border-accent";

/** Perforated tear-strip drawn along the ticket's top and bottom edges. */
const PERFORATION =
  "absolute left-0 right-0 h-[10px] bg-[radial-gradient(circle_at_6px_50%,var(--surface)_3.5px,transparent_4px)] bg-[length:14px_10px] bg-repeat-x";

type Phase = "idle" | "sending" | "sent" | "gone" | "error";

interface LeadTicketProps {
  botName: string;
  onDone: (leadName: string) => void;
}

export function LeadTicket({ botName, onDone }: LeadTicketProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [emailTouched, setEmailTouched] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const submitLead = useSubmitLead();

  const reduce = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const emailValid = EMAIL_RE.test(email.trim());
  const showEmailError = emailTouched && email.trim().length > 0 && !emailValid;
  const locked = phase === "sending" || phase === "sent" || phase === "gone";
  const canSubmit = name.trim().length > 0 && emailValid && !locked;

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

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    const leadName = name.trim();

    setPhase("sending");
    try {
      const res = await submitLead.mutateAsync({
        name: leadName,
        email: email.trim(),
        phone: phone.trim() || undefined,
        botId: BOT_ID,
      });
      if (!res?.ok) throw new Error("Lead submission rejected");
    } catch {
      setPhase("error");
      return;
    }

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
  }, [canSubmit, name, email, phone, submitLead, onDone, reduce]);

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
          aria-label="Your name"
          required
          disabled={locked}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={cn(TICKET_INPUT, showEmailError && "border-bad")}
          type="email"
          placeholder="Email"
          aria-label="Email"
          aria-invalid={showEmailError}
          required
          disabled={locked}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
        />
        {showEmailError && (
          <p role="alert" className="-mt-1 text-[11.5px] leading-[1.4] text-bad">
            That doesn&apos;t look like a valid email — double check it?
          </p>
        )}
        <input
          className={TICKET_INPUT}
          type="tel"
          placeholder="Phone (optional)"
          aria-label="Phone (optional)"
          disabled={locked}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <button
        type="button"
        className={cn(
          "mt-3 w-full rounded-r1 border-none py-[11px] font-ui text-[13.5px] font-[700] text-[var(--on-accent)]",
          "cursor-pointer bg-accent transition-opacity",
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
        <p role="alert" className="mt-2 text-[12px] leading-[1.4] text-bad">
          Couldn&apos;t send your details — check your connection and try again.
        </p>
      )}
    </div>
  );
}

export function LeadStub() {
  return (
    <div className="flex items-center gap-2.5 rounded-r2 border border-[color-mix(in_srgb,var(--good)_30%,transparent)] bg-[color-mix(in_srgb,var(--good)_12%,var(--surface))] px-[14px] py-3 text-[13px]">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-good text-white">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
      <div>
        <b>Thanks — we&rsquo;ll be in touch soon.</b>
      </div>
    </div>
  );
}
