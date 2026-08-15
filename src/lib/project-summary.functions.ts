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
 * Generates a short "what this project does" summary (en/pt/es) via
 * Anthropic. Admin-only, on-demand (button click in the admin panel) — never
 * called automatically by a visitor opening the project modal. Returns the
 * text only; the admin panel is responsible for saving it onto the relevant
 * `projects` row (same path as any other manual edit), so a generated
 * summary never overwrites an admin's edit without an explicit save.
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
      if (!readme) throw new Error("Could not fetch a README for this repository.");
      description = readme.slice(0, 6000);
    }

    const summary = await generateSummaryText({
      title: data.title,
      description,
      tech: data.tech,
    });

    return { ok: true as const, summary };
  });
