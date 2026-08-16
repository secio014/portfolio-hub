import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Sparkles, Star } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { projectLabelsQuery, reposQuery } from "@/lib/queries";
import { localized, useI18n } from "@/lib/i18n";
import { generateProjectSummary } from "@/lib/project-summary.functions";
import {
  AdminCard,
  EmptyState,
  LocalizedField,
  PanelHeader,
  RowActions,
  SaveBar,
  SelectField,
  TextField,
  ToggleField,
  swapOrder,
  useAdminTable,
  type Row,
} from "./kit";

/**
 * Synced repos live in `github_repos_cache` (read-only mirror of GitHub);
 * per-repo customizations (featured, visible, label, overridden text...)
 * live as a "projects" row with a matching `github_repo_id`, created lazily
 * the first time an admin touches that repo. Merges the two into what the
 * editor and featured picker need. `labelsByKey` resolves the repo's raw
 * production/study signal to a label id when no override exists yet, so the
 * select shows the right pre-selected value from the start.
 */
function mergeGithubRow(repo: Row, override: Row | undefined, labelsByKey: Map<string, Row>): Row {
  const topics = Array.isArray(repo["topics"]) ? (repo["topics"] as string[]) : [];
  return {
    title: override?.["title"] ?? { en: repo["name"] },
    description:
      override?.["description"] ?? (repo["description"] ? { en: repo["description"] } : {}),
    summary: override?.["summary"] ?? {},
    full_name: repo["full_name"],
    slug: override?.["slug"] ?? repo["name"],
    repo_url: override?.["repo_url"] ?? repo["html_url"],
    demo_url: override?.["demo_url"] ?? repo["homepage"] ?? null,
    tech:
      override?.["tech"] ??
      [repo["language"], ...topics].filter((item): item is string => Boolean(item)),
    label_id:
      override?.["label_id"] ??
      labelsByKey.get(String(repo["category"] ?? "production"))?.["id"] ??
      null,
    order: override?.["order"] ?? 0,
    featured: Boolean(override?.["featured"]),
    visible: override ? Boolean(override["visible"]) : true,
  };
}

export function ProjectsPanel() {
  const { t } = useI18n();
  const manualTable = useAdminTable("projects");
  const { data: repoCache = [] } = useQuery(reposQuery);
  const { data: labels = [] } = useQuery(projectLabelsQuery);
  const labelsByKey = new Map(labels.filter((l) => l["key"]).map((l) => [String(l["key"]), l]));

  const overrideByRepoId = new Map<number, Row>();
  for (const row of manualTable.rows) {
    if (row["github_repo_id"] != null) overrideByRepoId.set(Number(row["github_repo_id"]), row);
  }
  const manual = manualTable.rows.filter((row) => row["github_repo_id"] == null);

  async function saveGithubOverride(repo: Row, values: Row) {
    const override = overrideByRepoId.get(Number(repo["github_repo_id"]));
    if (override) {
      await manualTable.update(override["id"], values);
    } else {
      await manualTable.insert({
        source: "github",
        github_repo_id: repo["github_repo_id"],
        label_id: labelsByKey.get(String(repo["category"] ?? "production"))?.["id"] ?? null,
        order: 0,
        visible: true,
        ...values,
      });
    }
  }

  const featuredItems = [
    ...manual.map((row) => ({
      key: String(row["id"]),
      title: String((row["title"] as Row)?.["en"] ?? row["slug"] ?? "untitled"),
      featured: Boolean(row["featured"]),
      isGithub: false,
      onToggle: (value: boolean) => void manualTable.update(row["id"], { featured: value }),
    })),
    ...repoCache.map((repo) => {
      const override = overrideByRepoId.get(Number(repo["github_repo_id"]));
      return {
        key: `repo-${repo["github_repo_id"]}`,
        title: String((override?.["title"] as Row)?.["en"] ?? repo["name"]),
        featured: Boolean(override?.["featured"]),
        isGithub: true,
        onToggle: (value: boolean) => void saveGithubOverride(repo, { featured: value }),
      };
    }),
  ];

  return (
    <div className="space-y-4">
      <PanelHeader
        title="projects"
        hint={t("admin.projects.hint")}
        action={
          <Button
            size="sm"
            className="h-9 font-mono text-xs"
            onClick={() =>
              void manualTable.insert({
                title: { en: "New project" },
                source: "manual",
                label_id: labelsByKey.get("production")?.["id"] ?? null,
                order: manual.length,
              })
            }
          >
            <Plus className="size-3.5" /> {t("admin.projects.addProject")}
          </Button>
        }
      />

      {featuredItems.length > 0 ? <FeaturedPicker items={featuredItems} /> : null}

      {manual.length === 0 && repoCache.length === 0 ? (
        <EmptyState label={t("admin.projects.empty")} />
      ) : null}

      {manual.map((row, index) => (
        <ProjectRow
          key={row["id"]}
          row={row}
          labels={labels}
          onSave={(values) => manualTable.update(row["id"], values)}
          onDelete={() => manualTable.remove(row["id"])}
          onUp={
            index > 0
              ? () => swapOrder("projects", row, manual[index - 1]!, manualTable.refresh)
              : undefined
          }
          onDown={
            index < manual.length - 1
              ? () => swapOrder("projects", row, manual[index + 1]!, manualTable.refresh)
              : undefined
          }
        />
      ))}

      {repoCache.length > 0 ? (
        <div className="space-y-4 pt-4">
          <h3 className="mono-label flex items-center gap-2">
            <SiGithub className="size-3.5" /> {t("admin.projects.syncedFromGithub")}
          </h3>
          {repoCache.map((repo) => (
            <ProjectRow
              key={repo["id"]}
              row={mergeGithubRow(
                repo,
                overrideByRepoId.get(Number(repo["github_repo_id"])),
                labelsByKey,
              )}
              labels={labels}
              readOnlyRemote
              onSave={(values) => void saveGithubOverride(repo, values)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

type FeaturedItem = {
  key: string;
  title: string;
  featured: boolean;
  isGithub: boolean;
  onToggle: (value: boolean) => void;
};

/**
 * Quick checklist to pick which projects (manual or synced from GitHub) show
 * up in the home's "featured projects" block, without opening each project's
 * full editor. The home shows the first 6 marked as featured.
 */
function FeaturedPicker({ items }: { items: FeaturedItem[] }) {
  const { t } = useI18n();
  const featuredCount = items.filter((item) => item.featured).length;
  const sorted = [...items].sort((a, b) => {
    const featuredDiff = Number(b.featured) - Number(a.featured);
    if (featuredDiff !== 0) return featuredDiff;
    return a.title.localeCompare(b.title);
  });

  return (
    <AdminCard>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="mono-label flex items-center gap-1.5">
          <Star className="size-3.5 text-signal" /> {t("admin.projects.featuredProjects")}
        </p>
        <span className="font-mono text-[11px] text-muted-foreground">
          {featuredCount === 1
            ? t("admin.projects.selectedCountSingular", { count: featuredCount })
            : t("admin.projects.selectedCountPlural", { count: featuredCount })}
        </span>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {sorted.map((item) => (
          <li key={item.key}>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2 font-mono text-xs transition-colors hover:border-signal/40">
              <Switch checked={item.featured} onCheckedChange={item.onToggle} />
              <span className="truncate">{item.title}</span>
              {item.isGithub ? (
                <SiGithub className="ml-auto size-3 shrink-0 text-muted-foreground" />
              ) : null}
            </label>
          </li>
        ))}
      </ul>
    </AdminCard>
  );
}

function ProjectRow({
  row,
  labels,
  onSave,
  onDelete,
  onUp,
  onDown,
  readOnlyRemote = false,
}: {
  row: Row;
  labels: Row[];
  onSave: (values: Row) => void;
  onDelete?: (() => void) | undefined;
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
  readOnlyRemote?: boolean;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<Row>(row);
  // `row` is a fresh object every render for GitHub-synced repos
  // (mergeGithubRow() rebuilds it each time, including on unrelated
  // background refetches of other admin queries), so resetting on `row`
  // identity would wipe in-progress, unsaved edits mid-typing. Resync only
  // when we're actually looking at a different project.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setDraft(row), [row["id"] ?? row["full_name"]]);
  const set = (key: string, value: unknown) => setDraft((prev) => ({ ...prev, [key]: value }));
  const tech = Array.isArray(draft["tech"]) ? (draft["tech"] as string[]).join(", ") : "";
  const [generating, setGenerating] = useState(false);

  /**
   * Fills the description straight from the AI (using the repo's README as
   * input automatically when available — never shown, just fed in) into the
   * draft. No intermediate review step: same pattern as any other field,
   * the admin reviews it inline and clicks Salvar to persist.
   */
  async function handleGenerate() {
    setGenerating(true);
    try {
      const { summary, summaryError } = await generateProjectSummary({
        data: {
          title: localized(draft["title"], "en"),
          description: localized(draft["description"], "en"),
          tech: Array.isArray(draft["tech"]) ? (draft["tech"] as string[]) : [],
          readmeFrom: String(draft["full_name"] ?? "") || null,
        },
      });
      if (summary) {
        set("description", summary);
        toast.success(t("admin.projects.descriptionGenerated"));
      } else if (summaryError) {
        toast.warning(summaryError);
      }
    } catch (err) {
      toast.error((err as Error).message || t("admin.projects.generateFailed"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AdminCard>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs text-signal">
          {String((draft["title"] as Row)?.["en"] ?? draft["slug"] ?? "untitled")}
        </p>
        <div className="flex items-center gap-3">
          <ToggleField
            label={t("admin.content.visible")}
            checked={Boolean(draft["visible"])}
            onChange={(value) => {
              set("visible", value);
              onSave({ visible: value });
            }}
          />
          <RowActions onUp={onUp} onDown={onDown} onDelete={onDelete} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <span className="mono-label">{t("admin.projects.label")}</span>
          <SelectField
            value={String(draft["label_id"] ?? "")}
            onChange={(value) => set("label_id", value || null)}
          >
            <option value="">{t("admin.projects.noLabel")}</option>
            {labels.map((label) => (
              <option key={label["id"]} value={label["id"]}>
                {String((label["name"] as Row)?.["pt"] ?? label["key"] ?? label["id"])}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField
          label={t("admin.projects.order")}
          type="number"
          value={String(draft["order"] ?? 0)}
          onChange={(value) => set("order", Number(value) || 0)}
        />
        <TextField
          label={t("admin.writing.slug")}
          value={String(draft["slug"] ?? "")}
          disabled={readOnlyRemote}
          onChange={(value) => set("slug", value)}
        />
      </div>

      {readOnlyRemote ? (
        <p className="font-mono text-[11px] text-muted-foreground">
          {t("admin.projects.repoReadOnly", { url: String(draft["repo_url"] ?? "—") })}
        </p>
      ) : (
        <>
          <LocalizedField
            label={t("admin.content.title")}
            editor="input"
            value={draft["title"]}
            onChange={(value) => set("title", value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={t("admin.projects.repoUrl")}
              value={String(draft["repo_url"] ?? "")}
              onChange={(value) => set("repo_url", value)}
            />
            <TextField
              label={t("admin.projects.demoUrl")}
              value={String(draft["demo_url"] ?? "")}
              onChange={(value) => set("demo_url", value)}
            />
          </div>
          <TextField
            label={t("admin.projects.techList")}
            value={tech}
            onChange={(value) =>
              set(
                "tech",
                value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
          />
        </>
      )}

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="mono-label">{t("admin.projects.description")}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 font-mono text-[10px]"
            disabled={generating}
            onClick={() => void handleGenerate()}
          >
            <Sparkles className="size-3" />{" "}
            {generating ? t("admin.projects.generating") : t("admin.projects.generateViaAI")}
          </Button>
        </div>
        <LocalizedField
          label=""
          editor="markdown"
          rows={3}
          value={draft["description"]}
          onChange={(value) => set("description", value)}
        />
      </div>

      <LocalizedField
        label={t("admin.projects.quickSummary")}
        editor="textarea"
        rows={2}
        value={draft["summary"]}
        onChange={(value) => set("summary", value)}
      />

      <SaveBar
        onSave={() =>
          onSave(
            readOnlyRemote
              ? {
                  description: draft["description"] ?? {},
                  summary: draft["summary"] ?? {},
                  featured: Boolean(draft["featured"]),
                  visible: Boolean(draft["visible"]),
                  label_id: draft["label_id"] || null,
                  order: Number(draft["order"] ?? 0),
                }
              : {
                  title: draft["title"],
                  description: draft["description"],
                  summary: draft["summary"] ?? {},
                  slug: draft["slug"] || null,
                  repo_url: draft["repo_url"] || null,
                  demo_url: draft["demo_url"] || null,
                  tech: Array.isArray(draft["tech"]) ? draft["tech"] : [],
                  featured: Boolean(draft["featured"]),
                  visible: Boolean(draft["visible"]),
                  label_id: draft["label_id"] || null,
                  order: Number(draft["order"] ?? 0),
                },
          )
        }
      />
    </AdminCard>
  );
}
