"use client";

import { useEffect, useState } from "react";
import { signIn } from "@/lib/auth-client";

type ProviderId = "google" | "github" | "linkedin" | "facebook" | "twitter" | "apple";

const PROVIDER_LABEL: Record<ProviderId, string> = {
  google: "Google",
  github: "GitHub",
  linkedin: "LinkedIn",
  facebook: "Meta",
  twitter: "X",
  apple: "Apple",
};

/** Minimal inline brand marks — no icon library dependency. */
const PROVIDER_ICON: Record<ProviderId, React.ReactNode> = {
  google: (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M23.52 12.27c0-.82-.07-1.6-.2-2.36H12v4.47h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.74Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3a7.4 7.4 0 0 1-11-3.9H1.08v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.07 14.2a7.2 7.2 0 0 1 0-4.4V6.71H1.08a12 12 0 0 0 0 10.58l3.99-3.09Z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.08 6.71l3.99 3.09A7.16 7.16 0 0 1 12 4.75Z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.71 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.6.24 2.77.12 3.06.74.8 1.19 1.83 1.19 3.09 0 4.44-2.7 5.42-5.27 5.7.42.36.78 1.07.78 2.16v3.2c0 .32.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M7.12 9.4H4.02V19.9h3.1V9.4ZM5.57 4.6a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6ZM19.98 19.9h-3.1v-5.4c0-1.29-.02-2.94-1.79-2.94-1.8 0-2.07 1.4-2.07 2.85v5.49h-3.1V9.4h2.97v1.43h.04c.41-.78 1.43-1.6 2.94-1.6 3.14 0 3.72 2.07 3.72 4.76v5.9Z"
      />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.1 24 12.07Z"
      />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18.24 2.25h3.3l-7.2 8.23 8.47 11.27h-6.63l-5.2-6.8-5.94 6.8H1.75l7.7-8.8L1.34 2.25h6.8l4.7 6.22 5.4-6.22Zm-1.16 17.5h1.83L7 4.15H5.03L17.08 19.75Z" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M16.36 1c.1 1.13-.32 2.24-1 3.05-.7.83-1.86 1.48-2.98 1.4-.13-1.1.4-2.25 1.05-3 .74-.85 1.98-1.48 2.93-1.45ZM20.5 17.2c-.5 1.16-.74 1.68-1.4 2.7-.9 1.42-2.18 3.2-3.76 3.22-1.4.02-1.76-.9-3.66-.9-1.9 0-2.3.88-3.7.92-1.58.05-2.78-1.53-3.68-2.94-2.52-3.9-2.78-8.48-1.23-10.92 1.1-1.73 2.83-2.75 4.46-2.75 1.66 0 2.7.92 4.08.92 1.33 0 2.14-.92 4.07-.92 1.44 0 2.97.79 4.06 2.14-3.57 1.95-2.99 7.03.76 8.53Z" />
    </svg>
  ),
};

const ALL_PROVIDERS: ProviderId[] = ["google", "github", "linkedin", "facebook", "twitter", "apple"];

/**
 * Renders one button per social provider that's actually configured
 * server-side (checked via /api/auth-providers, since Better Auth's client
 * has no built-in way to know which providers the server enabled). If none
 * are configured yet, renders nothing rather than 6 buttons that all fail —
 * see src/lib/auth.ts for how to activate each one (real OAuth app
 * credentials required per provider; nothing here fabricates those).
 */
export function SocialSignInButtons({ callbackURL }: { callbackURL: string }) {
  const [available, setAvailable] = useState<ProviderId[] | null>(null);
  const [pending, setPending] = useState<ProviderId | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth-providers")
      .then((res) => res.json())
      .then((data: Record<ProviderId, boolean>) => {
        if (cancelled) return;
        setAvailable(ALL_PROVIDERS.filter((p) => data[p]));
      })
      .catch(() => {
        if (!cancelled) setAvailable([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = async (provider: ProviderId) => {
    setError("");
    setPending(provider);
    try {
      const { error: signInError } = await signIn.social({ provider, callbackURL });
      if (signInError) {
        setError(signInError.message || `${PROVIDER_LABEL[provider]} sign-in isn't available right now.`);
      }
      // On success Better Auth redirects the browser to the provider —
      // nothing further to do here.
    } catch {
      setError(`${PROVIDER_LABEL[provider]} sign-in isn't available right now.`);
    } finally {
      setPending(null);
    }
  };

  if (available === null || available.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="grid grid-cols-1 gap-2">
        {available.map((provider) => (
          <button
            key={provider}
            type="button"
            disabled={pending !== null}
            onClick={() => handleClick(provider)}
            className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-border bg-panel py-2.5 text-sm font-medium text-fg transition-colors hover:bg-border/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {PROVIDER_ICON[provider]}
            {pending === provider ? "Redirecting…" : `Continue with ${PROVIDER_LABEL[provider]}`}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</div>
      )}

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
