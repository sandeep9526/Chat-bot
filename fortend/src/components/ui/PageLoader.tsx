"use client";

import React, { useEffect, useState } from "react";

export function LogoLoader({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes loader-split {
              0%, 100% {
                transform: translateX(0) scale(1);
                opacity: 1;
              }
              45%, 55% {
                transform: translateX(var(--move)) scale(0.92);
                opacity: 0.8;
              }
            }
            @keyframes loader-pulse {
              0%, 100% { transform: scale(1); }
              50%      { transform: scale(1.04); }
            }
            .animate-loader-pulse {
              animation: loader-pulse 1.6s ease-in-out infinite;
            }
            .animate-loader-split {
              animation: loader-split 1.6s ease-in-out infinite;
            }
          `,
        }}
      />
      <div className={`relative animate-loader-pulse ${className}`}>
        <svg className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <g transform="translate(5, 0)">
            {/* Left (accent) half */}
            <path
              className="animate-loader-split origin-center"
              style={{ "--move": "-9px" } as React.CSSProperties}
              d="M45 0 L0 25 L0 75 L45 100 L45 72 L22 58 L22 42 L45 28 Z"
              fill="var(--accent, #F5A623)"
            />
            {/* Right (dark/text) half */}
            <path
              style={{ "--move": "9px", animationDelay: "0.05s" } as React.CSSProperties}
              d="M45 0 L90 25 L90 75 L45 100 L45 72 L68 58 L68 42 L45 28 Z"
              fill="currentColor"
              className="animate-loader-split origin-center text-[var(--text)]"
            />
          </g>
        </svg>
      </div>
    </>
  );
}

export function PageLoader() {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start the fade out after 1 second minimum duration
    const timer = setTimeout(() => {
      setFading(true);
      // Remove it from the DOM after the CSS transition finishes
      setTimeout(() => {
        setMounted(false);
      }, 500);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div 
      id="page-loader" 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--bg)] transition-all duration-[450ms] ease-out ${
        fading ? "opacity-0 invisible pointer-events-none" : ""
      }`}
    >
      <LogoLoader />
    </div>
  );
}
