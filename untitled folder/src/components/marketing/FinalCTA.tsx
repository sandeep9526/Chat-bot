import { ArrowRightIcon, SparkleIcon } from "./icons";
import { Reveal } from "./Reveal";

export function FinalCTA() {
  return (
    <section className="bg-[#F8F8F6] section-normal">
      <div className="marketing-container">
        <Reveal>
          <div className="relative overflow-hidden rounded-[20px] bg-[#08111F] px-8 sm:px-20 py-18 sm:py-24 text-center">
            {/* Subtle background geometry */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/3 rounded-full bg-[#F5A900]/[0.06] blur-[120px]" />
              <div className="absolute left-0 bottom-0 h-[400px] w-[400px] -translate-x-1/3 translate-y-1/3 rounded-full bg-[#F5A900]/[0.04] blur-[100px]" />
              {/* Dot grid */}
              <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:24px_24px]" />
            </div>
            
            <div className="relative z-10 mx-auto max-w-[600px]">
              <span className="inline-flex items-center gap-2.5 text-[13px] font-[600] uppercase tracking-wider text-[#F5A900]">
                <SparkleIcon className="h-4 w-4" />
                READY TO BUILD?
              </span>
              
              <h2 className="mt-6 font-display text-[clamp(34px,4.5vw,50px)] font-[700] leading-[1.05] tracking-[-0.03em] text-white">
                Ready to power your <br /> customer conversations?
              </h2>
              <p className="mt-6 text-[17px] leading-[1.65] text-white/55 max-w-[460px] mx-auto">
                Deploy an AI agent trained on your business content. Answers customers 24/7 and captures every lead.
              </p>
              
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="/sign-up"
                  className="btn-primary btn-shine h-[48px] px-8 text-[16px]"
                >
                  Start free
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/demo"
                  className="inline-flex h-[48px] items-center justify-center rounded-[10px] border border-white/15 bg-transparent px-8 text-[16px] font-[600] text-white transition-all duration-150 hover:bg-white/5 hover:border-white/25"
                >
                  Book a demo
                </a>
              </div>

              <p className="mt-7 flex items-center justify-center gap-5 text-[14px] text-white/35">
                <span>No credit card required</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>Setup in minutes</span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
