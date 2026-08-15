import { useState } from "react";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { AdminCard, PanelHeader, TextField } from "./kit";
import { Button } from "@/components/ui/button";

type Step = "form" | "code";

/**
 * Change-password flow with two checks before anything is written:
 * 1. the current password must be correct (re-verified via signInWithPassword)
 * 2. a 6-digit code sent to the account's own e-mail must be entered (acts as
 *    a second factor, since Supabase's built-in MFA is TOTP-only)
 * Only after both pass does it call updateUser with the new password.
 */
export function SecurityPanel() {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("form");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function reset() {
    setStep("form");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCode("");
    setEmail(null);
  }

  async function requestCode() {
    if (newPassword.length < 8) {
      toast.error(t("admin.security.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("admin.security.passwordsDontMatch"));
      return;
    }
    setPending(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userEmail = userData.user?.email;
      if (userError || !userEmail) throw new Error(t("admin.security.accountNotIdentified"));

      const { error: passwordError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (passwordError) throw new Error(t("admin.security.wrongCurrentPassword"));

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: { shouldCreateUser: false },
      });
      if (otpError) throw otpError;

      setEmail(userEmail);
      setStep("code");
      toast.success(t("admin.security.codeSent", { email: userEmail }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("admin.security.verificationStartFailed"),
      );
    } finally {
      setPending(false);
    }
  }

  async function confirmAndChange() {
    if (!email) return;
    if (code.trim().length < 6) {
      toast.error(t("admin.security.enterCode"));
      return;
    }
    setPending(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });
      if (verifyError) throw new Error(t("admin.security.invalidCode"));

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      toast.success(t("admin.security.passwordChanged"));
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("admin.security.confirmationFailed"),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <PanelHeader title={t("admin.security.title")} hint={t("admin.security.hint")} />
      <AdminCard>
        {step === "form" ? (
          <>
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-signal" />
              <p className="mono-label">{t("admin.security.changePassword")}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label={t("admin.security.currentPassword")}
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
              <TextField
                label={t("admin.security.newPassword")}
                type="password"
                value={newPassword}
                onChange={setNewPassword}
              />
              <TextField
                label={t("admin.security.confirmNewPassword")}
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="h-9 font-mono text-xs"
              disabled={pending || !currentPassword || !newPassword || !confirmPassword}
              onClick={() => void requestCode()}
            >
              <Mail className="size-3.5" />
              {pending ? t("admin.security.sending") : t("admin.security.sendCode")}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-signal" />
              <p className="mono-label">{t("admin.security.confirmCodeSentTo", { email: email ?? "" })}</p>
            </div>
            <div className="max-w-[10rem]">
              <TextField
                label={t("admin.security.codeLabel")}
                value={code}
                onChange={setCode}
                maxLength={6}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="h-9 font-mono text-xs"
                disabled={pending || code.trim().length < 6}
                onClick={() => void confirmAndChange()}
              >
                {pending ? t("admin.security.confirming") : t("admin.security.confirmAndChange")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 font-mono text-xs"
                disabled={pending}
                onClick={reset}
              >
                {t("admin.kit.cancel")}
              </Button>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  );
}
