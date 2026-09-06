"use client";

import { useState, useMemo } from "react";
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Check, 
  X,
  RotateCcw
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

export function ChangePasswordSection() {
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);

  // Field visibility toggles
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Real-time password strength evaluation
  const strengthInfo = useMemo(() => {
    if (!newPassword) return { score: 0, label: "", color: "bg-border", text: "text-muted" };

    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score += 1;
    if (/\d/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword) || newPassword.length >= 12) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "bg-rose-500", text: "text-rose-500" };
      case 2:
        return { score: 2, label: "Fair", color: "bg-amber-500", text: "text-amber-500" };
      case 3:
        return { score: 3, label: "Good", color: "bg-blue-500", text: "text-blue-500" };
      case 4:
        return { score: 4, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
      default:
        return { score: 0, label: "Too short", color: "bg-rose-500", text: "text-rose-500" };
    }
  }, [newPassword]);

  // Checklist criteria rules
  const criteria = useMemo(() => ({
    minChars: newPassword.length >= 8,
    mixedCase: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    hasNumberOrSymbol: /\d/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword),
    isMatched: confirmPassword.length > 0 && newPassword === confirmPassword,
  }), [newPassword, confirmPassword]);

  const isFormValid =
    currPassword.trim().length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const handleReset = () => {
    setCurrPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorMsg("");
    setSuccessMsg("");
    setShowCurr(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currPassword) {
      setErrorMsg("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match. Please verify.");
      return;
    }

    if (currPassword === newPassword) {
      setErrorMsg("New password cannot be the same as your current password.");
      return;
    }

    setLoading(true);

    try {
      const res: any = authClient.changePassword
        ? await authClient.changePassword({
            currentPassword: currPassword,
            newPassword: newPassword,
            revokeOtherSessions: revokeOtherSessions,
          })
        : { error: { message: "Password management is managed via the auth server." } };

      if (res?.error) {
        setErrorMsg(res.error.message || "Failed to update password. Please check your current password.");
      } else {
        setSuccessMsg(
          revokeOtherSessions
            ? "Password updated successfully! All other active sessions have been revoked."
            : "Password updated successfully!"
        );
        setCurrPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred while changing your password.");
    } finally {
      setLoading(false);
    }
  };

  const hasAnyInput = currPassword || newPassword || confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-bad/10 border border-bad/25 text-bad text-[13px] animate-fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 font-[500] leading-snug">{errorMsg}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-good/10 border border-good/25 text-good text-[13px] animate-fade-in">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 font-[500] leading-snug">{successMsg}</div>
          </div>
        )}

        {/* Current Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-[650] text-fg flex items-center justify-between">
            <span>Current Password</span>
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-muted pointer-events-none">
              <KeyRound className="w-4 h-4 opacity-70" />
            </div>
            <input
              type={showCurr ? "text" : "password"}
              value={currPassword}
              onChange={(e) => setCurrPassword(e.target.value)}
              placeholder="Enter your current password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-surface pl-10 pr-10 py-2.5 text-[13.5px] text-fg placeholder:text-muted/50 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/10 hover:border-border-strong"
            />
            <button
              type="button"
              onClick={() => setShowCurr(!showCurr)}
              className="absolute right-3 p-1 rounded-lg text-muted hover:text-fg transition-colors cursor-pointer"
              aria-label={showCurr ? "Hide current password" : "Show current password"}
            >
              {showCurr ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12.5px] font-[650] text-fg">New Password</label>
            {newPassword && (
              <span className={cn("text-[11.5px] font-[700] transition-colors", strengthInfo.text)}>
                {strengthInfo.label}
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-muted pointer-events-none">
              <Lock className="w-4 h-4 opacity-70" />
            </div>
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Create a new strong password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-border bg-surface pl-10 pr-10 py-2.5 text-[13.5px] text-fg placeholder:text-muted/50 outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/10 hover:border-border-strong"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 p-1 rounded-lg text-muted hover:text-fg transition-colors cursor-pointer"
              aria-label={showNew ? "Hide new password" : "Show new password"}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength Bar Meter */}
          {newPassword && (
            <div className="mt-1 flex flex-col gap-1.5 animate-fade-in">
              <div className="grid grid-cols-4 gap-1.5 w-full">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      strengthInfo.score >= step ? strengthInfo.color : "bg-border/60"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Live Validation Rules Chips */}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-[600] transition-colors",
              criteria.minChars 
                ? "bg-good/10 border-good/25 text-good" 
                : "bg-surface/50 border-border/70 text-muted"
            )}>
              {criteria.minChars ? <Check className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-muted/40 ml-0.5" />}
              <span>8+ characters</span>
            </div>

            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-[600] transition-colors",
              criteria.mixedCase 
                ? "bg-good/10 border-good/25 text-good" 
                : "bg-surface/50 border-border/70 text-muted"
            )}>
              {criteria.mixedCase ? <Check className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-muted/40 ml-0.5" />}
              <span>Upper & lowercase</span>
            </div>

            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-[600] transition-colors",
              criteria.hasNumberOrSymbol 
                ? "bg-good/10 border-good/25 text-good" 
                : "bg-surface/50 border-border/70 text-muted"
            )}>
              {criteria.hasNumberOrSymbol ? <Check className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-muted/40 ml-0.5" />}
              <span>Number or symbol</span>
            </div>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12.5px] font-[650] text-fg">Confirm New Password</label>
            {confirmPassword && (
              <span className={cn(
                "flex items-center gap-1 text-[11.5px] font-[700] animate-fade-in",
                criteria.isMatched ? "text-good" : "text-amber-500"
              )}>
                {criteria.isMatched ? (
                  <>
                    <Check className="w-3 h-3" /> Passwords match
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3" /> Passwords do not match
                  </>
                )}
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-muted pointer-events-none">
              <Lock className="w-4 h-4 opacity-70" />
            </div>
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              className={cn(
                "w-full rounded-xl border bg-surface pl-10 pr-10 py-2.5 text-[13.5px] text-fg placeholder:text-muted/50 outline-none transition-all hover:border-border-strong",
                confirmPassword && !criteria.isMatched 
                  ? "border-amber-500/50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10" 
                  : confirmPassword && criteria.isMatched 
                    ? "border-good/50 focus:border-good focus:ring-2 focus:ring-good/10"
                    : "border-border focus:border-accent focus:ring-2 focus:ring-accent/10"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 p-1 rounded-lg text-muted hover:text-fg transition-colors cursor-pointer"
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Security Options: Revoke other sessions */}
        <label className="flex items-start gap-3 mt-1 p-3 rounded-xl border border-border/70 bg-surface/40 hover:bg-surface transition-colors cursor-pointer select-none">
          <input
            type="checkbox"
            checked={revokeOtherSessions}
            onChange={(e) => setRevokeOtherSessions(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
          />
          <div className="flex flex-col">
            <span className="text-[12.5px] font-[650] text-fg">Log out of all other devices & sessions</span>
            <span className="text-[11.5px] text-muted leading-normal mt-0.5">
              Recommended. Immediately disconnects any other active browsers or apps logged into your account.
            </span>
          </div>
        </label>

        {/* Form Actions Footer */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-[13px] font-[700] hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Update Password</span>
              </>
            )}
          </button>

          {hasAnyInput && (
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border text-muted hover:text-fg hover:bg-panel/50 text-[12.5px] font-[600] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </form>
  );
}
