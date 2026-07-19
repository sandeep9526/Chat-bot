import { AnimatedChat } from "./AnimatedChat";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";
import { CheckIcon, XIcon } from "./icons";

const GENERIC = [
  "Invents hours, prices and promises",
  "No sources — you just have to trust it",
  "Answers, then lets the lead walk away",
];
const ZEVA = [
  "Answers only from your content",
  "Cites the source file + match %",
  "Captures name + phone on every chat",
];

export function WhyZevaQuotes() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-14">
        <div>
          <Reveal>
            <Eyebrow>Why it&apos;s different</Eyebrow>
          </Reveal>
          <Reveal
            as="h2"
            delay={60}
            className="mt-3 font-display text-[clamp(26px,4vw,42px)] font-[750] leading-[1.08] tracking-[-.02em] text-fg"
          >
            Generic bots guess. <span className="text-accent">Zeva quotes.</span>
          </Reveal>
          <Reveal
            as="p"
            delay={120}
            className="mt-4 max-w-[52ch] text-[15.5px] leading-[1.65] text-muted"
          >
            Zeva only answers from the documents you give it, and shows the
            source and match strength behind every reply. No made-up hours, no
            wrong prices, no promises you never made. Your reputation stays
            yours.
          </Reveal>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Reveal delay={160}>
              <div className="card h-full p-5">
                <p className="text-[12px] font-[750] uppercase tracking-[.12em] text-faint">
                  Generic bot
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {GENERIC.map((g) => (
                    <li
                      key={g}
                      className="flex items-start gap-2.5 text-[13.5px] leading-snug text-muted"
                    >
                      <span
                        className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[#ef4444]"
                        style={{ background: "color-mix(in srgb, #ef4444 12%, transparent)" }}
                      >
                        <XIcon className="h-3 w-3" />
                      </span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <div className="card h-full border-accent-ring p-5 ring-1 ring-accent-ring">
                <p className="text-[12px] font-[750] uppercase tracking-[.12em] text-accent">
                  Zeva
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {ZEVA.map((z) => (
                    <li
                      key={z}
                      className="flex items-start gap-2.5 text-[13.5px] font-[600] leading-snug text-fg"
                    >
                      <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-good/15 text-good">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      {z}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={120}>
          <AnimatedChat />
        </Reveal>
      </Container>
    </section>
  );
}
