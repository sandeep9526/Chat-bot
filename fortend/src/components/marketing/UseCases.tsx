"use client";

import Link from "next/link";
import { Reveal } from "./Reveal";
import { Scissors, Stethoscope, Briefcase, Wrench, Quote } from "lucide-react";
import { SectionHead } from "./SectionHead";

const CASES = [
  {
    icon: Scissors,
    tag: "Salons & spas",
    title: "Turn price inquiries into bookings.",
    body: "Answer questions about services and pricing instantly. When they are ready, capture their contact details for a confirmed appointment.",
    ask: "Do you have anything open this Saturday?",
  },
  {
    icon: Stethoscope,
    tag: "Clinics & practices",
    title: "Patient intake on autopilot.",
    body: "Provide policy answers and intake forms securely. Capture new patient information before your front desk even opens.",
    ask: "Are weekend appointments available?",
  },
  {
    icon: Briefcase,
    tag: "Agencies & consultancies",
    title: "Qualify high-value clients.",
    body: "Filter out bad fits automatically. Ask qualifying questions about project budgets and scope before passing the lead to your team.",
    ask: "Do you take on rebranding projects?",
  },
  {
    icon: Wrench,
    tag: "Home services",
    title: "Emergency dispatch & quotes.",
    body: "Capture addresses, phone numbers, and urgent service requests immediately, so your team can dispatch the right person instantly.",
    ask: "My heater broke — can someone come today?",
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="bg-bg py-24 border-t border-border scroll-mt-20 font-sans">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-9">

        <SectionHead
          align="center"
          eyebrow="Industry Use Cases"
          title="Built for businesses where every unanswered question matters."
          description="Whether you're booking appointments or qualifying high-value clients, OchreShift turns conversations into revenue for service businesses."
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {CASES.map((item, i) => (
            <Reveal key={item.tag} delay={200 + i * 60} className="h-full">
              <div className="bg-surface border border-border rounded-2xl p-8 md:p-10 hover:border-accent/40 transition-all flex flex-col h-full group shadow-lg">
                <div className="w-14 h-14 rounded-xl bg-panel border border-border flex items-center justify-center text-accent mb-8 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                  <item.icon size={28} />
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-[700] text-muted uppercase tracking-widest mb-3">{item.tag}</div>
                  <h3 className="text-[22px] font-[700] text-fg mb-4 leading-tight">{item.title}</h3>
                  <p className="text-[16px] text-muted leading-relaxed">{item.body}</p>
                </div>
                <div className="mt-8 inline-flex items-start gap-2.5 self-start rounded-2xl rounded-bl-sm bg-panel border border-border px-4 py-3 shadow-sm">
                  <Quote size={13} className="text-accent shrink-0 mt-1" aria-hidden />
                  <span className="text-[14px] leading-snug text-muted">&ldquo;{item.ask}&rdquo;</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150}>
          <div className="mt-16 max-w-[720px] mx-auto text-center rounded-2xl border border-border bg-surface p-8 md:p-10 shadow-card">
            <p className="text-[19px] md:text-[21px] font-[650] text-fg leading-snug">
              Whichever business you run, the math is the same.
            </p>
            <p className="mt-2.5 text-[15px] text-muted">
              Every question your website can&apos;t answer is a customer talking to a competitor instead.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="w-full sm:w-auto bg-accent text-[#08111F] font-[600] px-8 py-3.5 rounded-md hover:bg-accent-strong transition-colors"
              >
                Start free
              </Link>
              <Link
                href="/demo"
                className="w-full sm:w-auto border border-border bg-panel text-fg font-[500] px-8 py-3.5 rounded-md hover:border-accent/50 transition-colors"
              >
                Try the live demo
              </Link>
            </div>
            <p className="mt-5 font-mono text-[11px] tracking-wide text-faint uppercase">
              No credit card required · Setup in minutes
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
