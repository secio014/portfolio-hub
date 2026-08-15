import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const EVENT_TYPES = ["page_view", "project_click", "resume_download", "contact_click"] as const;

const schema = z.object({
  event_type: z.enum(EVENT_TYPES),
  page_or_project_id: z.string().trim().max(120).nullable().optional().default(null),
  referrer: z.string().trim().max(200).nullable().optional().default(null),
});

/**
 * Public analytics endpoint. The `anon` role has no insert grant on
 * `analytics_events`; events are validated here (fixed event vocabulary,
 * bounded string lengths) and written with the privileged client.
 */
export const recordAnalyticsEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("analytics_events").insert({
      event_type: data.event_type,
      page_or_project_id: data.page_or_project_id?.slice(0, 120) ?? null,
      referrer: data.referrer?.slice(0, 200) ?? null,
    });
    return { ok: true };
  });
