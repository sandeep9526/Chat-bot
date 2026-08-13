import { Check } from "lucide-react";
import { Reveal } from "./Reveal";

export function Pricing() {
  return (
    <section id="pricing" className="bg-white section-normal">
      <div className="marketing-container">
        
        <Reveal>
          <div className="text-center max-w-[560px] mx-auto mb-14">
            <span className="eyebrow">
              PRICING
            </span>
            <h2 className="mt-5 marketing-h2">
              Simple, predictable pricing.
            </h2>
            <p className="mt-5 text-[17px] text-[#475569]">
              Start building for free, then scale as you grow.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start max-w-[1060px] mx-auto">
          
          {/* Starter Plan */}
          <Reveal delay={0}>
            <div className="group rounded-[14px] border border-[#E5E7EB] bg-[#F8F8F6] p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <h3 className="text-[20px] font-[600] text-[#08111F]">Starter</h3>
              <p className="mt-2.5 text-[15px] text-[#475569]">Perfect for small projects and side hustles.</p>
              <div className="mt-7 flex items-baseline text-[42px] font-[700] text-[#08111F]">
                $0
                <span className="ml-2 text-[15px] font-[500] text-[#64748B]">/mo</span>
              </div>
              <a href="/sign-up" className="mt-8 flex h-12 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-[15px] font-[600] text-[#08111F] transition-all duration-150 hover:bg-[#F8F8F6] w-full">
                Get Started
              </a>
              <ul className="mt-8 space-y-3.5 text-[15px] text-[#475569]">
                {["1,000 requests/month", "Community support", "Basic analytics", "1 project"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check strokeWidth={2} className="h-4.5 w-4.5 text-[#F5A900] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Pro Plan */}
          <Reveal delay={80}>
            <div className="relative rounded-[14px] border-2 border-[#F5A900] bg-white p-8 shadow-[0_12px_40px_-12px_rgba(245,169,0,0.25)] transform md:-translate-y-4 transition-all duration-200 hover:-translate-y-5 hover:shadow-[0_20px_50px_-12px_rgba(245,169,0,0.3)]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#F5A900] px-5 py-1.5 text-[12px] font-[700] uppercase tracking-wider text-[#08111F]">
                Most Popular
              </div>
              <h3 className="text-[20px] font-[600] text-[#08111F]">Pro</h3>
              <p className="mt-2.5 text-[15px] text-[#475569]">For growing businesses and production apps.</p>
              <div className="mt-7 flex items-baseline text-[42px] font-[700] text-[#08111F]">
                $49
                <span className="ml-2 text-[15px] font-[500] text-[#64748B]">/mo</span>
              </div>
              <a href="/sign-up" className="mt-8 flex h-12 items-center justify-center rounded-[10px] bg-[#F5A900] text-[15px] font-[600] text-[#08111F] transition-all duration-150 hover:-translate-y-[1px] active:scale-[0.98] w-full btn-shine">
                Start 14-Day Free Trial
              </a>
              <ul className="mt-8 space-y-3.5 text-[15px] text-[#08111F]">
                {["50,000 requests/month", "Priority email support", "Advanced analytics", "Unlimited projects", "Remove branding"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 font-[500]">
                    <Check strokeWidth={2} className="h-4.5 w-4.5 text-[#F5A900] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Custom Plan */}
          <Reveal delay={160}>
            <div className="group rounded-[14px] border border-[#E5E7EB] bg-[#F8F8F6] p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <h3 className="text-[20px] font-[600] text-[#08111F]">Custom</h3>
              <p className="mt-2.5 text-[15px] text-[#475569]">For large organizations with custom needs.</p>
              <div className="mt-7 flex items-baseline text-[42px] font-[700] text-[#08111F]">
                Custom
              </div>
              <a href="/sign-up" className="mt-8 flex h-12 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-[15px] font-[600] text-[#08111F] transition-all duration-150 hover:bg-[#F8F8F6] w-full">
                Contact Sales
              </a>
              <ul className="mt-8 space-y-3.5 text-[15px] text-[#475569]">
                {["Custom volume pricing", "24/7 phone support", "Dedicated success manager", "Custom contracts", "SLA guarantee"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check strokeWidth={2} className="h-4.5 w-4.5 text-[#F5A900] shrink-0" /> {f}
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
