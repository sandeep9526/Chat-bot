"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/auth-client";
import { AuthShell } from "@/components/auth/AuthShell";
import { KeyRound, CheckCircle2 } from "lucide-react";

/**
 * Public reset-password execution page.
 * Re-authenticates user and updates Better Auth stored password credentials using URL recovery token.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if token exists in URL params
    const searchParams = new URLSearchParams(window.location.search);
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetErr } = await resetPassword({
        newPassword: password,
        token: token || undefined,
      });

      if (resetErr) {
        setError(resetErr.message || "Invalid or expired password reset token.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/sign-in");
          router.refresh();
        }, 3000);
      }
    } catch {
      setError("An unexpected network error occurred while updating your credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell>
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#10b981]/15 text-[#10b981]">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="font-display text-[24px] font-[800] tracking-[-.02em] text-fg">
            Password updated!
          </h1>
          <p className="mt-2 text-[14.5px] text-muted leading-relaxed">
            Your Zeva account password has been successfully reset. Redirecting you to sign in...
          </p>
          <div className="mt-8">
            <a
              href="/sign-in"
              className="inline-block rounded-r1 bg-gradient-to-br from-accent to-accent-strong px-6 py-2.5 text-[14px] font-[650] text-white shadow-[0_4px_12px_-4px_var(--accent)]"
            >
              Sign in now
            </a>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mb-7">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-r2 bg-accent/15 text-accent">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="font-display text-[26px] font-[800] tracking-[-.02em] text-fg">
          Set new password
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Create a strong password to re-secure your Zeva autonomous intelligence workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-[600] text-fg">
            New Password
          </label>
          <input
            type="password"
            autoFocus
            required
            className="w-full rounded-r1 border border-border bg-surface px-4 py-2.5 text-[14px] text-fg outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent-ring"
            placeholder="•••••••• (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-[600] text-fg">
            Confirm Password
          </label>
          <input
            type="password"
            required
            className="w-full rounded-r1 border border-border bg-surface px-4 py-2.5 text-[14px] text-fg outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent-ring"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-r1 bg-[#ef4444]/10 px-4 py-3 text-[13px] text-[#ef4444]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="w-full cursor-pointer rounded-r1 bg-gradient-to-br from-accent to-accent-strong py-3 text-[14.5px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Updating password…" : "Save & Continue"}
        </button>
      </form>
    </AuthShell>
  );
}
