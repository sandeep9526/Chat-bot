"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const INTEGRATIONS = [
  { name: "WordPress", logo: "WP" },
  { name: "Shopify", logo: "SH" },
  { name: "Webflow", logo: "WF" },
  { name: "React", logo: "RE" },
  { name: "Zendesk", logo: "ZD" },
  { name: "Intercom", logo: "IC" },
  { name: "HubSpot", logo: "HS" },
  { name: "Salesforce", logo: "SF" },
];

export function Integrations() {
  return (
    <section className="bg-white section-normal">
      <div className="marketing-container">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p className="eyebrow">INTEGRATIONS</p>
          <h2 className="mt-4 marketing-h2">
            Works where you work.
          </h2>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[900px] mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
        >
          {INTEGRATIONS.map((integration) => (
            <IntegrationCard key={integration.name} integration={integration} />
          ))}
        </motion.div>

      </div>
    </section>
  );
}

function IntegrationCard({ integration }: { integration: any }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 20, stiffness: 100 } }
      }}
    >
      <div
        ref={divRef}
        onMouseMove={handleMouseMove}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative flex h-[140px] w-full flex-col items-center justify-center overflow-hidden rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-[#F8F8F6] hover:bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      >
        <div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
          style={{
            opacity,
            background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(245,169,0,0.1), transparent 40%)`,
          }}
        />
        <div className="h-12 w-12 rounded-full bg-white border border-[rgba(0,0,0,0.04)] shadow-sm flex items-center justify-center text-[16px] font-[700] text-bg">
          {integration.logo}
        </div>
        <p className="mt-4 text-[14px] font-[500] text-[#475569]">{integration.name}</p>
      </div>
    </motion.div>
  );
}
