import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(200).optional().default(""),
});

/**
 * Public contact endpoint. Runs server-side only: input is validated and
 * sanitized here, the honeypot field is rejected silently, and the row is
 * written with the privileged client because `anon` has no insert grant
 * on `contact_messages`.
 */
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    if (data.website.trim().length > 0) {
      // Bot filled the hidden field — pretend everything is fine.
      return { ok: true };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name.slice(0, 120),
      email: data.email.slice(0, 200),
      message: data.message.slice(0, 4000),
    });
    if (error) throw new Error("Could not store the message");

    return { ok: true };
  });
