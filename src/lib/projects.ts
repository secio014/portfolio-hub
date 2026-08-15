import type { Locale } from "@/lib/i18n";
import { localized } from "@/lib/i18n";

export const LABEL_COLORS = [
  "signal",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "destructive",
] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

/** Written out literally (not built from a template string) so Tailwind's scanner picks them up. */
export const LABEL_COLOR_CLASSES: Record<LabelColor, string> = {
  signal: "border-signal/40 bg-signal/10 text-signal",
  "chart-2": "border-chart-2/40 bg-chart-2/10 text-chart-2",
  "chart-3": "border-chart-3/40 bg-chart-3/10 text-chart-3",
  "chart-4": "border-chart-4/40 bg-chart-4/10 text-chart-4",
  "chart-5": "border-chart-5/40 bg-chart-5/10 text-chart-5",
  destructive: "border-destructive/40 bg-destructive/10 text-destructive",
};
export const LABEL_COLOR_FALLBACK_CLASS = "border-border bg-muted text-muted-foreground";

/** Solid swatch fill, for color pickers (as opposed to the tinted badge style above). */
export const LABEL_SWATCH_CLASSES: Record<LabelColor, string> = {
  signal: "bg-signal",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
  destructive: "bg-destructive",
};

export function isPresetLabelColor(color: string | undefined): color is LabelColor {
  return (LABEL_COLORS as readonly string[]).includes(color ?? "");
}

/** Preset tokens get a Tailwind class; anything else (a custom hex) gets no class — pair with `labelColorStyle`. */
export function labelColorClass(color: string | undefined): string {
  if (isPresetLabelColor(color)) return LABEL_COLOR_CLASSES[color];
  return color ? "" : LABEL_COLOR_FALLBACK_CLASS;
}

/** Inline fallback for custom hex colors, which can't be Tailwind classes (no static string to scan). */
export function labelColorStyle(color: string | undefined): Record<string, string> | undefined {
  if (!color || isPresetLabelColor(color)) return undefined;
  return {
    borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
    backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
    color,
  };
}

export type ProjectLabel = { id: string; name: string; color: string };

export type DisplayProject = {
  key: string;
  title: string;
  description: string;
  tech: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  label: ProjectLabel | null;
  source: "github" | "manual";
  featured: boolean;
  isOrg: boolean;
  stars: number;
  caseStudySlug: string | null;
  /** Auto-generated "what this project does" blurb, shown in the click-to-open modal. */
  summary: string;
};

type RepoRow = {
  github_repo_id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  topics: unknown;
  html_url: string;
  homepage: string | null;
  stars: number;
  is_org: boolean;
  category: string;
};

type ProjectRow = {
  id: string;
  title: unknown;
  description: unknown;
  summary: unknown;
  label_id: string | null;
  tech: unknown;
  repo_url: string | null;
  demo_url: string | null;
  featured: boolean;
  visible: boolean;
  source: string;
  github_repo_id: number | null;
  slug: string | null;
};

type CaseRow = { slug: string; project_id: string | null };

export type ProjectLabelRow = { id: string; key: string | null; name: unknown; color: string };

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function resolveLabel(
  labelsById: Map<string, ProjectLabelRow>,
  labelsByKey: Map<string, ProjectLabelRow>,
  locale: Locale,
  labelId: string | null | undefined,
  fallbackKey: string,
): ProjectLabel | null {
  const row = (labelId ? labelsById.get(labelId) : undefined) ?? labelsByKey.get(fallbackKey);
  if (!row) return null;
  return { id: row.id, name: localized(row.name, locale) || fallbackKey, color: row.color };
}

export function buildProjects(
  repos: RepoRow[],
  manual: ProjectRow[],
  cases: CaseRow[],
  locale: Locale,
  labels: ProjectLabelRow[],
): DisplayProject[] {
  const overrideByRepoId = new Map<number, ProjectRow>();
  for (const row of manual) {
    if (row.github_repo_id != null) overrideByRepoId.set(row.github_repo_id, row);
  }
  const caseByProjectId = new Map<string, string>();
  for (const row of cases) {
    if (row.project_id) caseByProjectId.set(row.project_id, row.slug);
  }
  const labelsById = new Map(labels.map((label) => [label.id, label]));
  const labelsByKey = new Map(
    labels.filter((label) => label.key).map((label) => [label.key as string, label]),
  );

  const fromRepos: DisplayProject[] = repos
    .filter((repo) => overrideByRepoId.get(repo.github_repo_id)?.visible !== false)
    .map((repo) => {
      const override = overrideByRepoId.get(repo.github_repo_id);
      const topics = toStringArray(repo.topics);
      const tech = [repo.language, ...topics].filter((item): item is string => Boolean(item));
      return {
        key: `repo-${repo.github_repo_id}`,
        title: override ? localized(override.title, locale) || repo.name : repo.name,
        description:
          (override ? localized(override.description, locale) : "") || repo.description || "",
        tech: override && toStringArray(override.tech).length ? toStringArray(override.tech) : tech,
        repoUrl: override?.repo_url ?? repo.html_url,
        demoUrl: override?.demo_url ?? (repo.homepage || null),
        label: resolveLabel(labelsById, labelsByKey, locale, override?.label_id, repo.category),
        source: "github",
        featured: override?.featured ?? false,
        isOrg: repo.is_org,
        stars: repo.stars,
        caseStudySlug: override ? (caseByProjectId.get(override.id) ?? null) : null,
        summary: override ? localized(override.summary, locale) : "",
      };
    });

  const fromManual: DisplayProject[] = manual
    .filter((row) => row.github_repo_id == null && row.visible !== false)
    .map((row) => ({
      key: `manual-${row.id}`,
      title: localized(row.title, locale),
      description: localized(row.description, locale),
      tech: toStringArray(row.tech),
      repoUrl: row.repo_url,
      demoUrl: row.demo_url,
      label: resolveLabel(labelsById, labelsByKey, locale, row.label_id, "production"),
      source: "manual",
      featured: row.featured,
      isOrg: false,
      stars: 0,
      caseStudySlug: caseByProjectId.get(row.id) ?? null,
      summary: localized(row.summary, locale),
    }));

  return [...fromManual, ...fromRepos];
}
