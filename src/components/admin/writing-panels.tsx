import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  useAdminTable,
  type Row,
} from "./kit";

function useDraft(row: Row) {
  const [draft, setDraft] = useState<Row>(row);
  useEffect(() => setDraft(row), [row]);
  const set = (key: string, value: unknown) => setDraft((prev) => ({ ...prev, [key]: value }));
  return { draft, set };
}

function tagsToText(value: unknown) {
  return Array.isArray(value) ? (value as string[]).join(", ") : "";
}

function textToTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/* --------------------------------- Blog ---------------------------------- */

export function BlogPanel() {
  const table = useAdminTable("blog_posts", "published_at", false);

  return (
    <div className="space-y-4">
      <PanelHeader
        title="blog_posts"
        hint="Escreva, publique e despublique artigos. O conteúdo suporta markdown."
        action={
          <Button
            size="sm"
            className="h-9 font-mono text-xs"
            onClick={() =>
              table.insert({
                slug: `draft-${Date.now().toString(36)}`,
                title: { en: "Untitled post" },
                published: false,
              })
            }
          >
            <Plus className="size-3.5" /> Novo post
          </Button>
        }
      />
      {table.rows.length === 0 ? <EmptyState label="Nenhum post ainda." /> : null}
      {table.rows.map((row) => (
        <PostRow
          key={row["id"]}
          row={row}
          onSave={(values) => table.update(row["id"], values)}
          onDelete={() => table.remove(row["id"])}
        />
      ))}
    </div>
  );
}

function PostRow({
  row,
  onSave,
  onDelete,
}: {
  row: Row;
  onSave: (values: Row) => void;
  onDelete: () => void;
}) {
  const { draft, set } = useDraft(row);
  const [open, setOpen] = useState(false);
  const published = Boolean(draft["published"]);

  return (
    <AdminCard>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-left font-mono text-xs text-signal hover:underline"
        >
          {String((draft["title"] as Row)?.["en"] ?? draft["slug"])}
        </button>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase ${
              published ? "border-signal/40 text-signal" : "border-border text-muted-foreground"
            }`}
          >
            {published ? "publicado" : "rascunho"}
          </span>
          <RowActions onDelete={onDelete} />
        </div>
      </div>

      {open ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Slug"
              value={String(draft["slug"] ?? "")}
              onChange={(value) => set("slug", value)}
            />
            <TextField
              label="Tags (separadas por vírgula)"
              value={tagsToText(draft["tags"])}
              onChange={(value) => set("tags", textToTags(value))}
            />
          </div>
          <LocalizedField
            label="Título"
            editor="input"
            value={draft["title"]}
            onChange={(value) => set("title", value)}
          />
          <LocalizedField
            label="Resumo"
            editor="markdown"
            rows={2}
            value={draft["excerpt"]}
            onChange={(value) => set("excerpt", value)}
          />
          <LocalizedField
            label="Conteúdo"
            editor="markdown"
            rows={16}
            value={draft["content"]}
            onChange={(value) => set("content", value)}
          />
          <SaveBar
            onSave={() =>
              onSave({
                slug: draft["slug"],
                tags: Array.isArray(draft["tags"]) ? draft["tags"] : [],
                title: draft["title"],
                excerpt: draft["excerpt"],
                content: draft["content"],
                published,
                published_at: published
                  ? (draft["published_at"] ?? new Date().toISOString())
                  : null,
              })
            }
          >
            <ToggleField
              label={published ? "Publicado" : "Rascunho"}
              checked={published}
              onChange={(value) => set("published", value)}
            />
          </SaveBar>
        </>
      ) : null}
    </AdminCard>
  );
}

/* ------------------------------ Case studies ------------------------------ */

export function CaseStudiesPanel() {
  const table = useAdminTable("case_studies");
  const projects = useAdminTable("projects");

  return (
    <div className="space-y-4">
      <PanelHeader
        title="case_studies"
        hint="Aprofundamentos vinculados a um projeto. O corpo suporta markdown."
        action={
          <Button
            size="sm"
            className="h-9 font-mono text-xs"
            onClick={() =>
              table.insert({
                slug: `case-${Date.now().toString(36)}`,
                title: { en: "Untitled case study" },
                published: false,
              })
            }
          >
            <Plus className="size-3.5" /> Novo estudo de caso
          </Button>
        }
      />
      {table.rows.length === 0 ? <EmptyState label="Nenhum estudo de caso ainda." /> : null}
      {table.rows.map((row) => (
        <CaseRow
          key={row["id"]}
          row={row}
          projects={projects.rows}
          onSave={(values) => table.update(row["id"], values)}
          onDelete={() => table.remove(row["id"])}
        />
      ))}
    </div>
  );
}

function CaseRow({
  row,
  projects,
  onSave,
  onDelete,
}: {
  row: Row;
  projects: Row[];
  onSave: (values: Row) => void;
  onDelete: () => void;
}) {
  const { draft, set } = useDraft(row);
  const [open, setOpen] = useState(false);

  return (
    <AdminCard>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-left font-mono text-xs text-signal hover:underline"
        >
          {String((draft["title"] as Row)?.["en"] ?? draft["slug"])}
        </button>
        <RowActions onDelete={onDelete} />
      </div>

      {open ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Slug"
              value={String(draft["slug"] ?? "")}
              onChange={(value) => set("slug", value)}
            />
            <div className="space-y-1.5">
              <span className="mono-label">Projeto vinculado</span>
              <SelectField
                value={String(draft["project_id"] ?? "")}
                onChange={(value) => set("project_id", value || null)}
              >
                <option value="">— nenhum —</option>
                {projects.map((project) => (
                  <option key={project["id"]} value={project["id"]}>
                    {String((project["title"] as Row)?.["en"] ?? project["slug"] ?? project["id"])}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
          <LocalizedField
            label="Título"
            editor="input"
            value={draft["title"]}
            onChange={(value) => set("title", value)}
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <LocalizedField
              label="Problema"
              editor="markdown"
              rows={4}
              value={draft["problem"]}
              onChange={(value) => set("problem", value)}
            />
            <LocalizedField
              label="Abordagem"
              editor="markdown"
              rows={4}
              value={draft["approach"]}
              onChange={(value) => set("approach", value)}
            />
            <LocalizedField
              label="Resultado"
              editor="markdown"
              rows={4}
              value={draft["outcome"]}
              onChange={(value) => set("outcome", value)}
            />
          </div>
          <LocalizedField
            label="Corpo"
            editor="markdown"
            rows={14}
            value={draft["content"]}
            onChange={(value) => set("content", value)}
          />
          <SaveBar
            onSave={() =>
              onSave({
                slug: draft["slug"],
                project_id: draft["project_id"] || null,
                title: draft["title"],
                problem: draft["problem"],
                approach: draft["approach"],
                outcome: draft["outcome"],
                content: draft["content"],
                published: Boolean(draft["published"]),
              })
            }
          >
            <ToggleField
              label="Publicado"
              checked={Boolean(draft["published"])}
              onChange={(value) => set("published", value)}
            />
          </SaveBar>
        </>
      ) : null}
    </AdminCard>
  );
}
