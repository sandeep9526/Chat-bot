import * as React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: "default" | "dark" | "monochrome" | "mark";
}

export function OchreshiftLogo({ variant = "default", className = "", ...props }: LogoProps) {
  const isMark = variant === "mark";
  const isDark = variant === "dark";
  const isMono = variant === "monochrome";

  const leftColor = isMono ? "#0B0F19" : "#FFB800";
  const rightColor = isMono ? "#64748B" : isDark ? "#FFE066" : "var(--color-fg, #0B0F19)";
  const ochreText = isMono ? "#0B0F19" : "#FFB800";
  // const shiftText = "#ffffff";
  const shiftText = isDark ? "#ffffff" : "var(--color-fg, #0B0F19)";

  return (
    <svg
      viewBox={isMark ? "0 0 32 32" : "0 0 168 32"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Left Half */}
      <polygon
        points="16,2 3.88,9 3.88,23 16,30 16,22.4 10.8,19.4 10.8,11 16,8"
        fill={leftColor}
      />

      {/* Right Half */}
      <polygon
        points="16,2 16,8 21.2,11 21.2,19.4 16,22.4 16,30 28.12,23 28.12,9"
        fill={rightColor}
      />

      {/* Wordmark */}
      {!isMark && (
        <text
          x="38"
          y="23"
          style={{ fontFamily: 'var(--font-display, "Space Grotesk"), sans-serif' }}
          fontWeight="800"
          fontSize="22"
          letterSpacing="-0.02em"
        >
          <tspan fill={ochreText}>ochre</tspan>
          <tspan fill={shiftText}>shift</tspan>
        </text>
      )}
    </svg>
  );
}
