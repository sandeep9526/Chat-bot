import { useState } from "react";
import { X, LogOut } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";

export function VerificationRequiredModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: session } = useSession();
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage("");
    try {
      await authClient.sendVerificationEmail({
        email: session?.user?.email || "",
        callbackURL: window.location.href,
      });
      setResendMessage("Link sent! Please check your inbox.");
    } catch (e: any) {
      setResendMessage(e.message || "Failed to resend");
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || newEmail === session?.user?.email) {
      setIsEditingEmail(false);
      return;
    }
    setIsResending(true);
    setResendMessage("");
    try {
      await authClient.updateUser({
        email: newEmail.trim(),
      } as any);
      await authClient.sendVerificationEmail({
        email: newEmail.trim(),
        callbackURL: window.location.href,
      });
      setResendMessage("Email updated and link sent!");
      setIsEditingEmail(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      setResendMessage(e.message || "Failed to update email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-surface border border-border shadow-2xl rounded-[24px] p-8 max-w-[420px] w-full text-center relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-fg transition-colors"
        >
          <X size={20} />
        </button>
        <div className="mx-auto w-16 h-16 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mb-6 border border-orange-500/30">
          <LogOut size={28} className="ml-1" />
        </div>

        {!isEditingEmail ? (
          <>
            <h3 className="text-[22px] font-[800] text-fg tracking-tight mb-2">Check your email</h3>
            <p className="text-[14px] text-muted mb-6 leading-relaxed">
              We sent a verification link to <strong className="text-fg">{session?.user?.email}</strong>. Please click the link to verify your account before creating an agent.
            </p>
            {resendMessage && (
              <p className="text-[13px] font-[500] text-accent mb-4">{resendMessage}</p>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  try {
                    const fresh = await authClient.getSession();
                    if (fresh?.data?.user?.emailVerified) {
                      onSuccess();
                      return;
                    }
                  } catch { }
                  onClose();
                }}
                className="w-full py-3 bg-accent text-white rounded-xl font-[600] text-[15px] hover:bg-accent-strong transition-colors"
              >
                Okay, I'll check
              </button>
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full py-3 bg-panel text-fg rounded-xl font-[600] text-[15px] hover:bg-panel/80 transition-colors disabled:opacity-50"
              >
                {isResending ? "Sending..." : "Resend magic link"}
              </button>
              <button
                onClick={() => {
                  setNewEmail(session?.user?.email || "");
                  setIsEditingEmail(true);
                  setResendMessage("");
                }}
                className="text-[13px] text-muted hover:text-fg underline underline-offset-2 transition-colors mt-2"
              >
                Wrong email? Change it here
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-[22px] font-[800] text-fg tracking-tight mb-2">Update Email</h3>
            <p className="text-[14px] text-muted mb-6">Enter your correct email address below.</p>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-fg mb-4 outline-none focus:border-accent"
              placeholder="you@example.com"
            />
            {resendMessage && (
              <p className="text-[13px] font-[500] text-accent mb-4">{resendMessage}</p>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleChangeEmail}
                disabled={isResending || !newEmail.trim()}
                className="w-full py-3 bg-accent text-white rounded-xl font-[600] text-[15px] hover:bg-accent-strong transition-colors disabled:opacity-50"
              >
                {isResending ? "Updating..." : "Update & Send Link"}
              </button>
              <button
                onClick={() => setIsEditingEmail(false)}
                className="w-full py-3 bg-panel text-fg rounded-xl font-[600] text-[15px] hover:bg-panel/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
