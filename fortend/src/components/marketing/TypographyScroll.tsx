"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function TypographyScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // This section is 200vh tall to allow scrolling through the text
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  // We split the phrase into words and map their opacity/color to the scroll progress
  // "Human and AI working together in customer service"

  return (
    <section 
      ref={containerRef} 
      className="bg-[#F8F8F6] relative"
      style={{ height: "200vh" }}
    >
      <div className="sticky top-0 left-0 w-full h-screen flex items-center justify-center overflow-hidden">
        <div className="marketing-container max-w-[1200px]">
          <h2 className="font-display text-[clamp(48px,8vw,120px)] font-[700] leading-[1.05] tracking-[-0.04em] text-center flex flex-wrap justify-center gap-x-[clamp(12px,2vw,32px)] gap-y-4">
            <Word progress={scrollYProgress} range={[0.0, 0.15]}>Human</Word>
            <Word progress={scrollYProgress} range={[0.1, 0.25]}>and</Word>
            <Word progress={scrollYProgress} range={[0.2, 0.35]} highlight>AI</Word>
            <Word progress={scrollYProgress} range={[0.3, 0.45]}>working</Word>
            <Word progress={scrollYProgress} range={[0.4, 0.55]}>together</Word>
            <br className="hidden md:block" />
            <Word progress={scrollYProgress} range={[0.5, 0.65]}>in</Word>
            <Word progress={scrollYProgress} range={[0.6, 0.75]}>customer</Word>
            <Word progress={scrollYProgress} range={[0.7, 0.85]}>service.</Word>
          </h2>
        </div>
      </div>
    </section>
  );
}

function Word({ 
  children, 
  progress, 
  range,
  highlight = false
}: { 
  children: React.ReactNode; 
  progress: any; 
  range: [number, number];
  highlight?: boolean;
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const color = useTransform(
    progress, 
    range, 
    highlight ? ["#08111F", "#F5A900"] : ["#08111F", "#08111F"]
  );

  return (
    <motion.span style={{ opacity, color }}>
      {children}
    </motion.span>
  );
}
