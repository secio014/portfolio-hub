import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BOOTSTRAP_ADMIN_EMAIL = "pedroschmitz0000@gmail.com";

/**
 * One-time bootstrap: promotes the owner's account to admin, but only while no
 * admin exists yet. After the first admin is created this is a no-op.
 */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as { email?: string })?.email ?? "").toLowerCase();
    if (email !== BOOTSTRAP_ADMIN_EMAIL) return { ok: false as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("admin_users")
      .select("user_id", { count: "exact", head: true });
    if (countError) throw countError;
    if ((count ?? 0) > 0) return { ok: false as const };

    const { error } = await supabaseAdmin
      .from("admin_users")
      .insert({ user_id: context.userId, email });
    if (error) throw error;

    return { ok: true as const };
  });
