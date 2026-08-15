import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const settingsQuery = queryOptions({
  queryKey: ["site_settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const sectionsQuery = queryOptions({
  queryKey: ["site_sections"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_sections").select("*").order("order");
    if (error) throw error;
    return data ?? [];
  },
});

export const sectionBlocksQuery = queryOptions({
  queryKey: ["section_blocks"],
  queryFn: async () => {
    const { data, error } = await supabase.from("section_blocks").select("*").order("order");
    if (error) throw error;
    return data ?? [];
  },
});

export const labelsQuery = queryOptions({
  queryKey: ["site_labels"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_labels").select("*").order("order");
    if (error) throw error;
    return data ?? [];
  },
});

export const projectLabelsQuery = queryOptions({
  queryKey: ["project_labels"],
  queryFn: async () => {
    const { data, error } = await supabase.from("project_labels").select("*").order("order");
    if (error) throw error;
    return data ?? [];
  },
});

export const pagesQuery = queryOptions({
  queryKey: ["site_pages"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_pages").select("*").order("order");
    if (error) throw error;
    return data ?? [];
  },
});

export const reposQuery = queryOptions({
  queryKey: ["github_repos_cache"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("github_repos_cache")
      .select("*")
      .order("pushed_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const activityQuery = queryOptions({
  queryKey: ["github_activity_cache"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("github_activity_cache")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: async () => {
    const { data, error } = await supabase.from("projects").select("*").order("order");
    if (error) throw error;
    return data ?? [];
  },
});

export const timelineQuery = queryOptions({
  queryKey: ["career_timeline"],
  queryFn: async () => {
    const { data, error } = await supabase.from("career_timeline").select("*").order("order");
    if (error) throw error;
    return data ?? [];
  },
});

export const certificationsQuery = queryOptions({
  queryKey: ["certifications"],
  queryFn: async () => {
    const { data, error } = await supabase.from("certifications").select("*").order("order");
    if (error) throw error;
    return data ?? [];
  },
});

export const caseStudiesQuery = queryOptions({
  queryKey: ["case_studies"],
  queryFn: async () => {
    const { data, error } = await supabase.from("case_studies").select("*").order("order");
    if (error) throw error;
    return data ?? [];
  },
});

export const testimonialsQuery = queryOptions({
  queryKey: ["testimonials"],
  queryFn: async () => {
    const { data, error } = await supabase.from("testimonials").select("*").order("order");
    if (error) throw error;
    return data ?? [];
  },
});

export const blogQuery = queryOptions({
  queryKey: ["blog_posts"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const resumeQuery = queryOptions({
  queryKey: ["resume"],
  queryFn: async () => {
    const { data, error } = await supabase.from("resume").select("*").limit(1).maybeSingle();
    if (error) throw error;
    return data;
  },
});

/** Fire-and-forget first-party analytics. No third-party tracker. */
export function trackEvent(eventType: string, pageOrProjectId?: string) {
  if (typeof window === "undefined") return;
  void import("@/lib/analytics.functions").then(({ recordAnalyticsEvent }) =>
    recordAnalyticsEvent({
      data: {
        event_type: eventType as "page_view",
        page_or_project_id: pageOrProjectId ?? null,
        referrer: document.referrer ? new URL(document.referrer).hostname : null,
      },
    }).catch(() => undefined),
  );
}
