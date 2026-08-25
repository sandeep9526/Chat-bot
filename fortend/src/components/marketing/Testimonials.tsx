import Link from "next/link";
import { Inbox, BellRing, Webhook, Smartphone } from "lucide-react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

interface Quote {
  quote: string;
  name: string;
  role: string;
  metric?: string;
}

const QUOTES: Quote[] = [];

const DELIVERY_CHANNELS = [
  {
    icon: Inbox,
    title: "Live dashboard inbox",
    body: "Every conversation, AI summary, and scored lead in one place — with instant desktop alerts when a visitor needs you.",
  },
  {
    icon: BellRing,
    title: "Instant email alerts",
    body: "Hot lead captured while you're out? Get the full details in your inbox the moment it happens.",
  },
  {
    icon: Webhook,
    title: "Webhooks & your stack",
    body: "Push every lead straight into your CRM, spreadsheet, or internal tools automatically.",
  },
  {
    icon: Smartphone,
    title: "WhatsApp channel",
    body: "Let customers continue the conversation on the app they already use every day.",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-bg-2 border-t border-border font-sans">
      <Container>
        {QUOTES.length > 0 ? (
          <>
            <SectionHead
              align="center"
              eyebrow="Customer Stories"
              title="Teams that stopped losing leads."
              className="mb-16"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {QUOTES.map((q, i) => (
                <Reveal key={q.name} delay={i * 90} className="h-full">
                  <figure className="flex flex-col h-full bg-surface border border-border rounded-2xl p-8 shadow-card hover:border-accent/40 transition-colors">
                    <blockquote className="text-[15.5px] leading-relaxed text-fg flex-1">
                      &ldquo;{q.quote}&rdquo;
                    </blockquote>
                    {q.metric && (
                      <p className="mt-5 text-[14px] font-[700] text-accent">{q.metric}</p>
                    )}
                    <figcaption className="mt-4 pt-4 border-t border-border text-[13px] text-muted">
                      <span className="font-[600] text-fg">{q.name}</span> · {q.role}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </>
        ) : (
          <>
            <SectionHead
              align="center"
              eyebrow="Lead Delivery"
              title="Your leads land where your team lives."
              description="Capturing a lead means nothing if nobody sees it. OchreShift delivers every scored lead instantly — to your dashboard, your inbox, or the tools you already use."
              className="mb-16"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
              {DELIVERY_CHANNELS.map((channel, i) => (
                <Reveal key={channel.title} delay={i * 90} className="h-full">
                  <div className="flex flex-col h-full bg-surface border border-border rounded-2xl p-7 shadow-card hover:border-accent/40 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-panel border border-border flex items-center justify-center text-accent mb-5 shrink-0">
                      <channel.icon size={22} />
                    </div>
                    <h3 className="font-[700] text-[16.5px] text-fg mb-2.5 leading-snug">{channel.title}</h3>
                    <p className="text-[14px] leading-relaxed text-muted">{channel.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={300}>
              <p className="mt-10 text-center text-[14px] text-muted">
                Every lead arrives with the full transcript and an{" "}
                <span className="font-[600] text-fg">AI-written summary</span> — so your team
                responds in seconds, not questions.{" "}
                <Link href="/sign-up" className="text-accent font-[600] hover:underline underline-offset-4">
                  See it with your own content
                </Link>
              </p>
            </Reveal>
          </>
        )}
      </Container>
    </section>
  );
}
