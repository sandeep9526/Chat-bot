import { Check } from "lucide-react";
import { Reveal } from "./Reveal";

export function Pricing() {
  return (
    <section id="pricing" className="bg-white section-normal">
      <div className="marketing-container">
        
        <Reveal>
          <div className="text-center max-w-[520px] mx-auto mb-14">
            <p className="eyebrow mx-auto">PRICING</p>
            <h2 className="mt-4 marketing-h2">
              Simple, predictable pricing.
            </h2>
            <p className="mt-5 text-[17px] text-[#475569]">
              Start building for free, then scale as you grow.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start max-w-[1060px] mx-auto">
          
          {/* Starter */}
          <Reveal delay={0}>
            <div className="rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-[#F8F8F6] p-8 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.06)]">
              <h3 className="text-[20px] font-[600] text-bg">Starter</h3>
              <p className="mt-2 text-[15px] text-[#64748B]">For small projects and testing.</p>
              <div className="mt-6 flex items-baseline">
                <span className="text-[42px] font-[700] tracking-[-0.03em] text-bg">$19</span>
                <span className="ml-2 text-[15px] text-[#64748B]">/mo</span>
              </div>
              <a href="/sign-up" className="mt-7 flex h-11 items-center justify-center rounded-[10px] border border-[rgba(0,0,0,0.08)] bg-white text-[15px] font-[600] text-bg transition-all duration-150 hover:-translate-y-[1px] hover:bg-[#F8F8F6] w-full">
                Get Started
              </a>
              <ul className="mt-7 space-y-3.5 text-[15px] text-[#475569]">
                {["1,000 messages/month", "1 chatbot", "Basic analytics", "Email support"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check strokeWidth={2} className="h-4 w-4 text-[#F5A900] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Pro */}
          <Reveal delay={80}>
            <div className="relative rounded-[16px] border-2 border-[#F5A900] bg-white p-9 shadow-[0_16px_48px_-14px_rgba(245,169,0,0.2)] transform md:-translate-y-3 transition-all duration-300 hover:-translate-y-[18px] hover:shadow-[0_24px_60px_-14px_rgba(245,169,0,0.25)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F5A900] px-4 py-1 text-[11px] font-[700] uppercase tracking-wider text-bg">
                Most Popular
              </div>
              <h3 className="text-[22px] font-[700] text-bg">Pro</h3>
              <p className="mt-2 text-[15px] text-[#64748B]">For growing businesses.</p>
              <div className="mt-6 flex items-baseline">
                <span className="text-[48px] font-[800] tracking-[-0.03em] text-bg">$49</span>
                <span className="ml-2 text-[15px] text-[#64748B]">/mo</span>
              </div>
              <a href="/sign-up" className="mt-7 flex h-11 items-center justify-center rounded-[10px] bg-[#F5A900] text-[15px] font-[600] text-bg transition-all duration-150 hover:-translate-y-[1px] active:scale-[0.98] w-full btn-shine">
                Start 14-Day Free Trial
              </a>
              <ul className="mt-7 space-y-3.5 text-[15px] text-bg">
                {["50,000 messages/month", "Unlimited chatbots", "Advanced analytics", "Priority support", "Remove branding"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 font-[500]">
                    <Check strokeWidth={2} className="h-4 w-4 text-[#F5A900] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Enterprise */}
          <Reveal delay={160}>
            <div className="rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-[#F8F8F6] p-8 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.06)]">
              <h3 className="text-[20px] font-[600] text-bg">Enterprise</h3>
              <p className="mt-2 text-[15px] text-[#64748B]">For large organizations.</p>
              <div className="mt-6">
                <span className="text-[42px] font-[700] tracking-[-0.03em] text-bg">Custom</span>
              </div>
              <a href="/contact" className="mt-7 flex h-11 items-center justify-center rounded-[10px] border border-[rgba(0,0,0,0.08)] bg-white text-[15px] font-[600] text-bg transition-all duration-150 hover:-translate-y-[1px] hover:bg-[#F8F8F6] w-full">
                Contact Sales
              </a>
              <ul className="mt-7 space-y-3.5 text-[15px] text-[#475569]">
                {["Custom volume", "24/7 phone support", "Dedicated manager", "SLA guarantee", "Custom contracts"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check strokeWidth={2} className="h-4 w-4 text-[#F5A900] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
