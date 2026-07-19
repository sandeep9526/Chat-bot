"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-sm text-muted">Something went wrong.</p>
      <button
        type="button"
        className="cursor-pointer border-none bg-transparent text-sm text-accent underline focus-visible:outline-2 focus-visible:outline-accent"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
