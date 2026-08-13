import * as React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: "default" | "dark" | "monochrome" | "mark";
}

export function OchreshiftLogo({ variant = "default", className = "", ...props }: LogoProps) {
  const isMark = variant === "mark";
  const isMono = variant === "monochrome";
  const isDark = variant === "dark";

  return (
    <svg
      viewBox={isMark ? "0 0 32 32" : "0 0 168 32"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Hexagonal shift symbol */}
      <g>
        {/* Left chevron - Ochre */}
        <path
          d="M16 3L5 9.5V22.5L16 29V23L11 20V12L16 9V3Z"
          fill={isMono ? "currentColor" : "#F5A900"}
        />
        {/* Right chevron - Navy */}
        <path
          d="M16 3L27 9.5V22.5L16 29V23L21 20V12L16 9V3Z"
          fill={isMono ? "currentColor" : (isDark ? "#F8F8F6" : "#08111F")}
        />
      </g>

      {/* Wordmark */}
      {!isMark && (
        <text
          x="40"
          y="23"
          fontFamily="'Space Grotesk', system-ui, sans-serif"
          fontWeight="700"
          fontSize="22"
          letterSpacing="-0.02em"
          fill={isMono ? "currentColor" : (isDark ? "#F8F8F6" : "#08111F")}
        >
          <tspan fill={isMono ? "currentColor" : "#F5A900"}>ochre</tspan>
          <tspan>shift</tspan>
        </text>
      )}
    </svg>
  );
}
