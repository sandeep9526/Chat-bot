"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { AuthShell } from "@/components/auth/AuthShell";
import { useRedirectIfAuthed } from "@/components/auth/useRedirectIfAuthed";

/**
 * Sign-up page for creating admin accounts.
 * Only authorized users should access this.
 */
export default function SignUpPage() {
  const router = useRouter();
  const { redirecting } = useRedirectIfAuthed("/dashboard");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in → don't show the sign-up form; the hook is redirecting
  // to the dashboard.
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
      const { error: signUpError } = await signUp.email({
        name,
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message || "Registration failed");
      } else {
        // Success - Better Auth auto-signs in on registration (see
        // emailAndPassword.autoSignIn in lib/auth.ts), so we already have a
        // session — drop them straight into the dashboard, where a guided tour
        // and a "create your first bot" prompt greet them (replaces the old
        // step-by-step onboarding wizard).
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
          Create your account
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Start building your bot — no card required.
        </p>
      </div>

      <SocialSignInButtons callbackURL="/dashboard" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-[600] text-fg">
            Name
          </label>
          <input
            type="text"
            autoFocus
            required
            className="w-full rounded-r1 border border-border bg-surface px-4 py-2.5 text-[14px] text-fg outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent-ring"
            placeholder="Priya Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-[600] text-fg">
            Email
          </label>
          <input
            type="email"
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
            minLength={8}
            className="w-full rounded-r1 border border-border bg-surface px-4 py-2.5 text-[14px] text-fg outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent-ring"
            placeholder="Min 8 characters"
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-muted">
        Already have an account?{" "}
        <a href="/sign-in" className="font-[650] text-accent hover:underline">
          Sign in
        </a>
      </p>
    </AuthShell>
  );
}
