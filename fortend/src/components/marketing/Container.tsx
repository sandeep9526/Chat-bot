import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/** Shared max-width wrapper — matches the 1240px content width Studio uses. */
export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-[1240px] px-6 sm:px-9 ${className}`}>
      {children}
    </div>
  );
}
