import { Container } from "./Container";

/**
 * Two infinite marquee rows scrolling opposite ways, pausing on hover. These
 * are the *kinds* of small businesses Zeva is built for — target markets, not
 * claimed customers — so nothing here is fabricated social proof.
 */
const ROW_A = [
  "Salons",
  "Dental clinics",
  "Boutiques",
  "Yoga studios",
  "Real estate",
  "Coaching",
];
const ROW_B = [
  "Spas",
  "Gyms",
  "Restaurants",
  "Law firms",
  "Tutors",
  "Auto services",
];

function Row({ items, reverse }: { items: string[]; reverse?: boolean }) {
  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = [...items, ...items];
  return (
    <div className="marquee-mask overflow-hidden py-2">
      <div className={`marquee-track ${reverse ? "rev" : ""}`}>
        {loop.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="mx-2 inline-flex items-center gap-2 whitespace-nowrap rounded-r2 border border-border bg-surface px-4 py-2 text-[13.5px] font-[650] text-muted shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-accent to-good" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Marquee() {
  return (
    <section className="border-y border-border bg-panel py-10">
      <Container>
        <p className="mb-6 text-center text-[13px] font-[600] uppercase tracking-[.14em] text-faint">
          Built for local businesses that live on their leads
        </p>
      </Container>
      <div className="flex flex-col gap-3">
        <Row items={ROW_A} />
        <Row items={ROW_B} reverse />
      </div>
    </section>
  );
}
