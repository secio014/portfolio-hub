import { useState } from "react";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
      toast.error("A nova senha precisa ter pelo menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas novas não coincidem");
      return;
    }
    setPending(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userEmail = userData.user?.email;
      if (userError || !userEmail) throw new Error("Não foi possível identificar sua conta");

      const { error: passwordError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (passwordError) throw new Error("Senha atual incorreta");

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: { shouldCreateUser: false },
      });
      if (otpError) throw otpError;

      setEmail(userEmail);
      setStep("code");
      toast.success(`Código enviado para ${userEmail}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao iniciar verificação");
    } finally {
      setPending(false);
    }
  }

  async function confirmAndChange() {
    if (!email) return;
    if (code.trim().length < 6) {
      toast.error("Informe o código de 6 dígitos enviado por e-mail");
      return;
    }
    setPending(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });
      if (verifyError) throw new Error("Código inválido ou expirado");

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      toast.success("Senha alterada com sucesso");
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao confirmar código");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <PanelHeader
        title="segurança"
        hint="Trocar senha exige a senha atual e um código de verificação enviado ao seu e-mail (2FA)."
      />
      <AdminCard>
        {step === "form" ? (
          <>
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-signal" />
              <p className="mono-label">Trocar senha</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label="Senha atual"
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
              <TextField
                label="Nova senha"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
              />
              <TextField
                label="Confirmar nova senha"
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
              {pending ? "Enviando…" : "Enviar código de verificação"}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-signal" />
              <p className="mono-label">Confirme o código enviado para {email}</p>
            </div>
            <div className="max-w-[10rem]">
              <TextField label="Código (6 dígitos)" value={code} onChange={setCode} maxLength={6} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="h-9 font-mono text-xs"
                disabled={pending || code.trim().length < 6}
                onClick={() => void confirmAndChange()}
              >
                {pending ? "Confirmando…" : "Confirmar e trocar senha"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 font-mono text-xs"
                disabled={pending}
                onClick={reset}
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  );
}
