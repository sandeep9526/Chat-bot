"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { AuthShell } from "@/components/auth/AuthShell";
import { useRedirectIfAuthed } from "@/components/auth/useRedirectIfAuthed";

/**
 * Sign-in page for admin dashboard.
 * Users enter email + password to authenticate.
 */
export default function SignInPage() {
  const router = useRouter();
  const { redirecting } = useRedirectIfAuthed("/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in → useRedirectIfAuthed is navigating to the dashboard;
  // don't flash the sign-in form in the meantime.
  if (redirecting) {
    return (
      <AuthShell>
        <p className="text-center text-[14px] text-muted">Taking you to your dashboard…</p>
      </AuthShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Login failed");
      } else {
        // Success - redirect to their dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-7">
        <h1 className="font-display text-[26px] font-[800] tracking-[-.02em] text-fg">
          Welcome back
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Sign in to your Zeva dashboard.
        </p>
      </div>

      <SocialSignInButtons callbackURL="/dashboard" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-[600] text-fg">
            Email
          </label>
          <input
            type="email"
            autoFocus
            required
            className="w-full rounded-r1 border border-border bg-surface px-4 py-2.5 text-[14px] text-fg outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent-ring"
            placeholder="you@business.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-[600] text-fg">
            Password
          </label>
          <input
            type="password"
            required
            className="w-full rounded-r1 border border-border bg-surface px-4 py-2.5 text-[14px] text-fg outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent-ring"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-r1 bg-[#ef4444]/10 px-4 py-3 text-[13px] text-[#ef4444]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-r1 bg-gradient-to-br from-accent to-accent-strong py-3 text-[14.5px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-muted">
        Don&apos;t have an account?{" "}
        <a href="/sign-up" className="font-[650] text-accent hover:underline">
          Sign up
        </a>
      </p>
    </AuthShell>
  );
}
