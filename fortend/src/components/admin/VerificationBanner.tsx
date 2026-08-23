import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function VerificationBanner({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [errorMsg, setErrorMsg] = useState("");

  const handleResend = async (emailToUse: string) => {
    if (!emailToUse) return;
    setLoading(true);
    try {
      await (authClient.signIn as any).magicLink({
        email: emailToUse,
        callbackURL: "/dashboard",
      });
      setStatus("sent");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Failed to send email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    if (newEmail === user?.email) {
      setIsEditing(false);
      return;
    }
    setLoading(true);
    try {
      const res = await authClient.updateUser({ email: newEmail } as any);
      if (res.error) throw new Error(res.error.message);
      await handleResend(newEmail);
      setIsEditing(false);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to update email");
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-5 gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-500">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-[750] text-amber-800 dark:text-amber-400">
              Verify your email address
            </h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-amber-700/90 dark:text-amber-300/80 max-w-xl">
              You must verify your email before you can create or manage agents. We sent a verification link to <span className="font-semibold text-amber-800 dark:text-amber-200">{user?.email}</span>.
            </p>

            {status === "sent" && (
              <div className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Link sent! Please check your inbox and spam folder.
              </div>
            )}

            {status === "error" && (
              <div className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
          {!isEditing ? (
            <>
              <button
                onClick={() => handleResend(user?.email)}
                disabled={loading}
                className="flex h-9 items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 text-[13px] font-semibold text-white transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Resend Verification Link
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="text-[12.5px] font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 dark:text-amber-400 dark:hover:text-amber-200"
              >
                Wrong email? Change it here.
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email..."
                className="h-9 w-[220px] rounded-lg border border-border bg-background px-3 text-[13px] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                autoFocus
              />
              <button
                onClick={handleSaveEmail}
                disabled={loading || !newEmail || newEmail.length < 5}
                className="flex h-9 items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 px-4 text-[13px] font-semibold text-white transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save & Verify"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex h-9 items-center justify-center px-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
