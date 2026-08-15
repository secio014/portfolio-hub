import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateSummaryText } from "@/lib/ai/summarize.server";
import { cleanToken, fetchReadme } from "@/lib/github-sync.functions";

const schema = z.object({
  title: z.string(),
  description: z.string(),
  tech: z.array(z.string()).default([]),
  /** When set, the repo's README is fetched and used as the description input instead. */
  readmeFrom: z.string().nullable().default(null),
});

/**
 * Generates a project description (en/pt/es) via Anthropic, using the repo's
 * README as input when available (falls back to the manually-entered
 * description otherwise) — the README itself is only ever used as AI input,
 * never shown in the admin UI. Admin-only, on-demand (button click in the
 * admin panel) — never called automatically by a visitor opening the
 * project modal. The admin panel is responsible for saving the result onto
 * the relevant `projects` row (same path as any other manual edit), so a
 * generated description never overwrites an admin's edit without an
 * explicit save.
 *
 * The Workers AI binding this relies on only exists in a deployed/
 * `wrangler dev` runtime (see summarize.server.ts), so plain `vite dev`
 * always fails to generate. That failure is caught and returned as
 * `summaryError` instead of thrown, so the caller can show a clear message.
 */
export const generateProjectSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (!isAdmin) throw new Error("Forbidden: admin access required");

    let description = data.description;
    if (data.readmeFrom) {
      const readme = await fetchReadme(data.readmeFrom, cleanToken(process.env["GITHUB_TOKEN"]));
      if (readme) description = readme.slice(0, 6000);
    }

    try {
      const summary = await generateSummaryText({
        title: data.title,
        description,
        tech: data.tech,
      });
      return { ok: true as const, summary, summaryError: null };
    } catch (err) {
      return {
        ok: true as const,
        summary: null,
        summaryError: err instanceof Error ? err.message : "Failed to generate summary.",
      };
    }
  });
