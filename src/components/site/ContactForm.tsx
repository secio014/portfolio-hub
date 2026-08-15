import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { submitContactMessage } from "@/lib/contact.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const { t } = useI18n();
  const submit = useServerFn(submitContactMessage);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    try {
      await submit({
        data: {
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          message: String(data.get("message") ?? ""),
          // Honeypot: real users never fill this hidden field.
          website: String(data.get("website") ?? ""),
        },
      });
      toast.success(t("contact.success"));
      form.reset();
    } catch {
      toast.error(t("contact.error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel panel-glow relative space-y-5 overflow-hidden p-5 sm:p-8"
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: "var(--gradient-signal)" }}
        aria-hidden
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="mono-label">
            {t("contact.name")}
          </Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={120}
            className="h-11 rounded-lg focus-visible:ring-2 focus-visible:ring-signal/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="mono-label">
            {t("contact.email")}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            maxLength={200}
            className="h-11 rounded-lg focus-visible:ring-2 focus-visible:ring-signal/50"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message" className="mono-label">
          {t("contact.message")}
        </Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          className="rounded-lg focus-visible:ring-2 focus-visible:ring-signal/50"
        />
      </div>

      <div aria-hidden className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full gap-2 rounded-lg font-mono text-xs sm:w-auto"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {pending ? t("contact.sending") : t("contact.send")}
      </Button>
    </form>
  );
}
