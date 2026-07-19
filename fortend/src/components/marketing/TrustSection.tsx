import Link from "next/link";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";
import { ArrowRightIcon } from "./icons";

/**
 * Deliberately honest: Zeva has no real customers yet, so this shows no
 * testimonials or logos — it says so, and points at the one thing that's
 * actually real: the live Studio and demo.
 */
export function TrustSection() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="card mx-auto max-w-[820px] p-10 text-center sm:p-14">
            <div className="flex justify-center">
              <Eyebrow>See for yourself</Eyebrow>
            </div>
            <h2 className="mx-auto mt-3 max-w-[620px] font-display text-[clamp(24px,3.6vw,36px)] font-[750] leading-[1.15] tracking-[-.02em] text-fg">
              We&apos;d rather show you than tell you.
            </h2>
            <p className="mx-auto mt-4 max-w-[600px] text-[15px] leading-[1.65] text-muted">
              Zeva is early — there are no customer logos or testimonials to
              show here yet, and we&apos;d rather not make any up. The fastest
              way to judge it is to open the Studio, customize a widget, and ask
              it a real question.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-6 py-3.5 text-[15px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5"
              >
                Open the Studio
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-r1 border border-border bg-surface px-6 py-3.5 text-[15px] font-[650] text-fg transition-colors hover:border-accent-ring hover:text-accent"
              >
                Try the live demo
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
