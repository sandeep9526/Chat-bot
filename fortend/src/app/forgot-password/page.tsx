"use client";

import { useState } from "react";
import { forgetPassword } from "@/lib/auth-client";
import { AuthShell } from "@/components/auth/AuthShell";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

/**
 * Public forgot-password request page.
 * Dispatches automated recovery email with token link via SMTP/Resend.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: resetError } = await forgetPassword({
        email,
        redirectTo: "/reset-password",
      });

      if (resetError) {
        setError(resetError.message || "Could not send reset email. Please verify the address.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthShell>
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#10b981]/15 text-[#10b981]">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="font-display text-[24px] font-[800] tracking-[-.02em] text-fg">
            Check your email
          </h1>
          <p className="mt-2 text-[14.5px] text-muted leading-relaxed">
            We sent a password recovery link to <span className="font-[600] text-fg">{email}</span>. Click the link inside to set a new password.
          </p>
          <div className="mt-8 rounded-r1 border border-border bg-surface p-4 text-left text-[13px] text-muted">
            <span className="font-[600] text-fg">Didn&apos;t get it?</span> Check spam, or make sure you typed the right email.
          </div>
          <a
            href="/sign-in"
            className="mt-8 inline-flex items-center gap-2 text-[14px] font-[650] text-accent transition-colors hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mb-7">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-r2 bg-accent/15 text-accent">
          <Mail className="h-5 w-5" />
        </div>
        <h1 className="font-display text-[26px] font-[800] tracking-[-.02em] text-fg">
          Reset your password
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Enter the email on your account and we&apos;ll send a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-[600] text-fg">
            Email Address
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

        {error && (
          <div className="rounded-r1 bg-[#ef4444]/10 px-4 py-3 text-[13px] text-[#ef4444]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full cursor-pointer rounded-r1 bg-gradient-to-br from-accent to-accent-strong py-3 text-[14.5px] font-[650] text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending recovery link…" : "Send recovery link"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <a
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-[650] text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </a>
      </div>
    </AuthShell>
  );
}
