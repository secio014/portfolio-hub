import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AdminCard,
  ConfirmDialog,
  EmptyState,
  LocalizedField,
  PanelHeader,
  PromptDialog,
  RowActions,
  SaveBar,
  SelectField,
  TextField,
  ToggleField,
  db,
  swapOrder,
  useAdminTable,
  type Row,
} from "./kit";

const LAYOUTS: { value: string; label: string }[] = [
  { value: "vertical", label: "Vertical (empilhado)" },
  { value: "horizontal", label: "Horizontal (grade automática)" },
  { value: "carousel", label: "Carrossel" },
];

function useDraft(row: Row) {
  const [draft, setDraft] = useState<Row>(row);
  useEffect(() => setDraft(row), [row]);
  const set = (key: string, value: unknown) => setDraft((prev) => ({ ...prev, [key]: value }));
  return { draft, set };
}

function nextOrder(rows: Row[]) {
  return rows.reduce((max, row) => Math.max(max, Number(row["order"] ?? 0)), 0) + 1;
}

/* ------------------------------- Sections -------------------------------- */

const BLOCK_SECTION_LABELS: Record<string, string> = {
  activity: "Atividade no GitHub",
  stack: "Stack técnica",
  featured: "Projetos em destaque",
  testimonials: "Depoimentos",
  blog: "Artigos recentes",
};

function slugifySectionKey(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SectionsPanel({ pageSlug }: { pageSlug: string }) {
  const table = useAdminTable("site_sections");
  const pages = useAdminTable("site_pages");
  const blocksTable = useAdminTable("section_blocks");
  const [promptOpen, setPromptOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const rows = table.rows.filter((row) => (row["page_slug"] ?? "home") === pageSlug);
  const customRows = rows.filter((row) => row["type"] === "custom");

  function addSection(input: string) {
    const section_key = slugifySectionKey(input);
    if (!section_key) {
      toast.error("Chave inválida");
      return;
    }
    if (table.rows.some((row) => row["section_key"] === section_key)) {
      toast.error("Já existe uma seção com essa chave");
      return;
    }
    table.insert({
      section_key,
      type: "custom",
      visible: false,
      page_slug: pageSlug,
      order: nextOrder(rows),
    });
  }

  async function clearCustomSections() {
    const { error } = await db
      .from("site_sections")
      .delete()
      .eq("page_slug", pageSlug)
      .eq("type", "custom");
    if (error) {
      toast.error(error.message ?? "Falha ao excluir seções");
      return;
    }
    toast.success("Seções e divs excluídas");
    table.refresh();
    blocksTable.refresh();
  }

  return (
    <div className="space-y-4">
      <PanelHeader
        title="sections"
        hint="Blocos de texto exibidos nesta página. Edite por idioma, reordene, oculte ou mova para outra página. O corpo suporta markdown (blocos de código, links, vídeos/imagens)."
        action={
          <div className="flex gap-2">
            {customRows.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                className="h-9 font-mono text-xs text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmClearOpen(true)}
              >
                <Trash2 className="size-3.5" /> Excluir todas as seções custom
              </Button>
            ) : null}
            <Button size="sm" className="h-9 font-mono text-xs" onClick={() => setPromptOpen(true)}>
              <Plus className="size-3.5" /> Adicionar seção
            </Button>
          </div>
        }
      />
      <PromptDialog
        open={promptOpen}
        title="Nova seção"
        description="Chave da seção (ex: cta-newsletter). Usada internamente, não aparece no site."
        placeholder="cta-newsletter"
        confirmLabel="Criar"
        onOpenChange={setPromptOpen}
        onSubmit={addSection}
      />
      <ConfirmDialog
        open={confirmClearOpen}
        title={`Excluir ${customRows.length} seção(ões) custom desta página?`}
        description="Remove todas as seções custom desta página e as divs dentro delas. Seções fixas (hero, sobre, contato, blocos da home) não são afetadas. Esta ação não pode ser desfeita."
        confirmLabel="Excluir tudo"
        onOpenChange={setConfirmClearOpen}
        onConfirm={() => void clearCustomSections()}
      />
      {rows.length === 0 ? <EmptyState label="Nenhuma seção nesta página ainda." /> : null}
      {rows.map((row, index) => (
        <SectionRow
          key={row["id"]}
          row={row}
          pages={pages.rows}
          blocksTable={blocksTable}
          onSave={(values) => table.update(row["id"], values)}
          onMove={(nextPage) => table.update(row["id"], { page_slug: nextPage })}
          onDelete={row["type"] === "custom" ? () => table.remove(row["id"]) : undefined}
          onUp={
            index > 0
              ? () => swapOrder("site_sections", row, rows[index - 1]!, table.refresh)
              : undefined
          }
          onDown={
            index < rows.length - 1
              ? () => swapOrder("site_sections", row, rows[index + 1]!, table.refresh)
              : undefined
          }
        />
      ))}
    </div>
  );
}

function SectionRow({
  row,
  pages,
  blocksTable,
  onSave,
  onMove,
  onDelete,
  onUp,
  onDown,
}: {
  row: Row;
  pages: Row[];
  blocksTable: ReturnType<typeof useAdminTable>;
  onSave: (values: Row) => void;
  onMove: (pageSlug: string) => void;
  onDelete?: (() => void) | undefined;
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
}) {
  const { draft, set } = useDraft(row);
  const isCustom = row["type"] === "custom";
  const isBlock = row["type"] === "block";
  const sectionKey = String(row["section_key"] ?? "");
  const blockLabel = BLOCK_SECTION_LABELS[sectionKey];

  if (isBlock) {
    return (
      <AdminCard>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-mono text-xs text-signal">{blockLabel ?? sectionKey}</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              Bloco fixo ({sectionKey}) · não pode ser removido nem movido, apenas ocultado.
            </p>
          </div>
          <ToggleField
            label="Visível"
            checked={Boolean(draft["visible"])}
            onChange={(value) => {
              set("visible", value);
              onSave({ visible: value });
            }}
          />
        </div>
      </AdminCard>
    );
  }

  return (
    <AdminCard>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs text-signal">
          {row["section_key"]}
          {isCustom ? (
            <span className="ml-2 rounded-sm border border-border px-1 py-0.5 text-[10px] uppercase text-muted-foreground">
              custom
            </span>
          ) : null}
        </p>
        <div className="flex items-center gap-2">
          <ToggleField
            label="Visível"
            checked={Boolean(draft["visible"])}
            onChange={(value) => set("visible", value)}
          />
          <RowActions onUp={onUp} onDown={onDown} onDelete={onDelete} />
        </div>
      </div>
      {isCustom && pages.length > 0 ? (
        <div className="space-y-1.5">
          <span className="mono-label">Página</span>
          <SelectField
            value={String(row["page_slug"] ?? "home")}
            onChange={onMove}
            className="sm:w-64"
          >
            {pages.map((page) => (
              <option key={page["id"]} value={page["slug"]}>
                {String((page["title"] as Row)?.["pt"] ?? page["slug"])}
              </option>
            ))}
          </SelectField>
        </div>
      ) : null}
      <LocalizedField
        label="Título"
        editor="input"
        value={draft["title"]}
        onChange={(value) => set("title", value)}
      />
      <LocalizedField
        label="Subtítulo"
        editor="input"
        value={draft["subtitle"]}
        onChange={(value) => set("subtitle", value)}
      />
      <LocalizedField
        label="Corpo"
        editor="markdown"
        rows={8}
        value={draft["body"]}
        onChange={(value) => set("body", value)}
      />
      <p className="font-mono text-[11px] text-muted-foreground">
        Use os botões "imagem" e "vídeo" da barra de markdown para colar um link (YouTube, TikTok,
        Instagram ou direto) ou enviar um arquivo.
      </p>
      <SaveBar
        onSave={() =>
          onSave({
            title: draft["title"],
            subtitle: draft["subtitle"],
            body: draft["body"],
            layout: draft["layout"] ?? "vertical",
            visible: Boolean(draft["visible"]),
          })
        }
      />
      <SectionBlocksManager
        sectionId={String(row["id"])}
        blocksTable={blocksTable}
        layout={String(draft["layout"] ?? "vertical")}
        onLayoutChange={(value) => {
          set("layout", value);
          onSave({ layout: value });
        }}
      />
    </AdminCard>
  );
}

/**
 * Manages the repeatable "divs" nested inside a section: their own
 * title/body, reordering, and the layout (vertical/horizontal/carousel)
 * used to render them all on the site.
 */
function SectionBlocksManager({
  sectionId,
  blocksTable,
  layout,
  onLayoutChange,
}: {
  sectionId: string;
  blocksTable: ReturnType<typeof useAdminTable>;
  layout: string;
  onLayoutChange: (value: string) => void;
}) {
  const blocks = blocksTable.rows
    .filter((block) => block["section_id"] === sectionId)
    .sort((a, b) => Number(a["order"] ?? 0) - Number(b["order"] ?? 0));

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="mono-label">Divs ({blocks.length})</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 font-mono text-xs"
          onClick={() => blocksTable.insert({ section_id: sectionId, order: nextOrder(blocks) })}
        >
          <Plus className="size-3.5" /> Adicionar div
        </Button>
      </div>
      {blocks.length > 1 ? (
        <div className="space-y-1.5">
          <span className="mono-label">Layout</span>
          <SelectField value={layout} onChange={onLayoutChange} className="sm:w-64">
            {LAYOUTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>
      ) : null}
      {blocks.map((block, index) => (
        <SectionBlockRow
          key={block["id"]}
          block={block}
          onSave={(values) => blocksTable.update(block["id"], values)}
          onDelete={() => blocksTable.remove(block["id"])}
          onUp={
            index > 0
              ? () => swapOrder("section_blocks", block, blocks[index - 1]!, blocksTable.refresh)
              : undefined
          }
          onDown={
            index < blocks.length - 1
              ? () => swapOrder("section_blocks", block, blocks[index + 1]!, blocksTable.refresh)
              : undefined
          }
        />
      ))}
    </div>
  );
}

function SectionBlockRow({
  block,
  onSave,
  onDelete,
  onUp,
  onDown,
}: {
  block: Row;
  onSave: (values: Row) => void;
  onDelete: () => void;
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
}) {
  const { draft, set } = useDraft(block);
  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">
          {String(
            (draft["title"] as Row)?.["pt"] || (draft["title"] as Row)?.["en"] || "sem título",
          )}
        </span>
        <RowActions onUp={onUp} onDown={onDown} onDelete={onDelete} />
      </div>
      <LocalizedField
        label="Título"
        editor="input"
        value={draft["title"]}
        onChange={(value) => set("title", value)}
      />
      <LocalizedField
        label="Corpo"
        editor="markdown"
        rows={4}
        value={draft["body"]}
        onChange={(value) => set("body", value)}
      />
      <SaveBar onSave={() => onSave({ title: draft["title"], body: draft["body"] })} />
    </div>
  );
}

/* ------------------------------- Timeline -------------------------------- */

const TIMELINE_TYPES = [
  { value: "work", label: "Experiência profissional" },
  { value: "study", label: "Formação acadêmica" },
] as const;

export function TimelinePanel() {
  const table = useAdminTable("career_timeline");

  function addEntry(type: "work" | "study") {
    table.insert({
      institution: "Nova entrada",
      type,
      start_date: new Date().toISOString().slice(0, 10),
      order: nextOrder(table.rows),
    });
  }

  return (
    <div className="space-y-4">
      <PanelHeader
        title="career_timeline"
        hint="Formação acadêmica e experiência profissional exibidas na página Sobre."
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 font-mono text-xs"
              onClick={() => addEntry("study")}
            >
              <Plus className="size-3.5" /> Formação
            </Button>
            <Button size="sm" className="h-9 font-mono text-xs" onClick={() => addEntry("work")}>
              <Plus className="size-3.5" /> Experiência
            </Button>
          </div>
        }
      />
      {table.rows.length === 0 ? (
        <EmptyState label="Nenhuma entrada na linha do tempo ainda." />
      ) : null}
      {TIMELINE_TYPES.map((group) => {
        const rows = table.rows.filter((row) => (row["type"] ?? "work") === group.value);
        if (rows.length === 0) return null;
        return (
          <div key={group.value} className="space-y-4">
            <h3 className="mono-label text-signal">{group.label}</h3>
            {rows.map((row) => {
              const index = table.rows.indexOf(row);
              return (
                <TimelineRow
                  key={row["id"]}
                  row={row}
                  onSave={(values) => table.update(row["id"], values)}
                  onDelete={() => table.remove(row["id"])}
                  onUp={
                    index > 0
                      ? () =>
                          swapOrder("career_timeline", row, table.rows[index - 1]!, table.refresh)
                      : undefined
                  }
                  onDown={
                    index < table.rows.length - 1
                      ? () =>
                          swapOrder("career_timeline", row, table.rows[index + 1]!, table.refresh)
                      : undefined
                  }
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function TimelineRow({
  row,
  onSave,
  onDelete,
  onUp,
  onDown,
}: {
  row: Row;
  onSave: (values: Row) => void;
  onDelete: () => void;
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
}) {
  const { draft, set } = useDraft(row);
  return (
    <AdminCard>
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs text-signal">{String(draft["institution"] ?? "")}</p>
        <div className="flex items-center gap-2">
          <ToggleField
            label="Visível"
            checked={Boolean(draft["visible"])}
            onChange={(value) => set("visible", value)}
          />
          <RowActions onUp={onUp} onDown={onDown} onDelete={onDelete} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <span className="mono-label">Tipo</span>
          <SelectField
            value={String(draft["type"] ?? "work")}
            onChange={(value) => set("type", value)}
          >
            {TIMELINE_TYPES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField
          label="Instituição"
          value={String(draft["institution"] ?? "")}
          onChange={(value) => set("institution", value)}
        />
        <TextField
          label="Data de início"
          type="date"
          value={String(draft["start_date"] ?? "")}
          onChange={(value) => set("start_date", value)}
        />
        <TextField
          label="Data de término (vazio = atual)"
          type="date"
          value={String(draft["end_date"] ?? "")}
          onChange={(value) => set("end_date", value)}
        />
      </div>
      <LocalizedField
        label="Título"
        editor="input"
        value={draft["title"]}
        onChange={(value) => set("title", value)}
      />
      <LocalizedField
        label="Descrição"
        editor="markdown"
        rows={3}
        value={draft["description"]}
        onChange={(value) => set("description", value)}
      />
      <SaveBar
        onSave={() =>
          onSave({
            institution: draft["institution"],
            type: draft["type"] ?? "work",
            start_date: draft["start_date"] || null,
            end_date: draft["end_date"] || null,
            title: draft["title"],
            description: draft["description"],
            visible: Boolean(draft["visible"]),
          })
        }
      />
    </AdminCard>
  );
}

/* ---------------------------- Certifications ------------------------------ */

export function CertificationsPanel() {
  const table = useAdminTable("certifications");

  return (
    <div className="space-y-4">
      <PanelHeader
        title="certifications"
        hint="Cursos, certificados e credenciais."
        action={
          <Button
            size="sm"
            className="h-9 font-mono text-xs"
            onClick={() =>
              table.insert({ name: "Nova certificação", order: nextOrder(table.rows) })
            }
          >
            <Plus className="size-3.5" /> Adicionar certificação
          </Button>
        }
      />
      {table.rows.length === 0 ? <EmptyState label="Nenhuma certificação ainda." /> : null}
      {table.rows.map((row, index) => (
        <CertificationRow
          key={row["id"]}
          row={row}
          onSave={(values) => table.update(row["id"], values)}
          onDelete={() => table.remove(row["id"])}
          onUp={
            index > 0
              ? () => swapOrder("certifications", row, table.rows[index - 1]!, table.refresh)
              : undefined
          }
          onDown={
            index < table.rows.length - 1
              ? () => swapOrder("certifications", row, table.rows[index + 1]!, table.refresh)
              : undefined
          }
        />
      ))}
    </div>
  );
}

function CertificationRow({
  row,
  onSave,
  onDelete,
  onUp,
  onDown,
}: {
  row: Row;
  onSave: (values: Row) => void;
  onDelete: () => void;
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
}) {
  const { draft, set } = useDraft(row);
  return (
    <AdminCard>
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs text-signal">{String(draft["name"] ?? "")}</p>
        <div className="flex items-center gap-2">
          <ToggleField
            label="Visível"
            checked={Boolean(draft["visible"])}
            onChange={(value) => set("visible", value)}
          />
          <RowActions onUp={onUp} onDown={onDown} onDelete={onDelete} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nome"
          value={String(draft["name"] ?? "")}
          onChange={(value) => set("name", value)}
        />
        <TextField
          label="Emissor"
          value={String(draft["issuer"] ?? "")}
          onChange={(value) => set("issuer", value)}
        />
        <TextField
          label="Data"
          type="date"
          value={String(draft["date"] ?? "")}
          onChange={(value) => set("date", value)}
        />
        <TextField
          label="URL da credencial"
          value={String(draft["credential_url"] ?? "")}
          onChange={(value) => set("credential_url", value)}
        />
      </div>
      <SaveBar
        onSave={() =>
          onSave({
            name: draft["name"],
            issuer: draft["issuer"],
            date: draft["date"] || null,
            credential_url: draft["credential_url"] || null,
            visible: Boolean(draft["visible"]),
          })
        }
      />
    </AdminCard>
  );
}

/* ----------------------------- Testimonials ------------------------------- */

export function TestimonialsPanel() {
  const table = useAdminTable("testimonials");

  return (
    <div className="space-y-4">
      <PanelHeader
        title="testimonials"
        hint="Depoimentos de clientes e colegas."
        action={
          <Button
            size="sm"
            className="h-9 font-mono text-xs"
            onClick={() =>
              table.insert({ author_name: "Novo autor", order: nextOrder(table.rows) })
            }
          >
            <Plus className="size-3.5" /> Adicionar depoimento
          </Button>
        }
      />
      {table.rows.length === 0 ? <EmptyState label="Nenhum depoimento ainda." /> : null}
      {table.rows.map((row, index) => (
        <TestimonialRow
          key={row["id"]}
          row={row}
          onSave={(values) => table.update(row["id"], values)}
          onDelete={() => table.remove(row["id"])}
          onUp={
            index > 0
              ? () => swapOrder("testimonials", row, table.rows[index - 1]!, table.refresh)
              : undefined
          }
          onDown={
            index < table.rows.length - 1
              ? () => swapOrder("testimonials", row, table.rows[index + 1]!, table.refresh)
              : undefined
          }
        />
      ))}
    </div>
  );
}

function TestimonialRow({
  row,
  onSave,
  onDelete,
  onUp,
  onDown,
}: {
  row: Row;
  onSave: (values: Row) => void;
  onDelete: () => void;
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
}) {
  const { draft, set } = useDraft(row);
  return (
    <AdminCard>
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs text-signal">{String(draft["author_name"] ?? "")}</p>
        <div className="flex items-center gap-2">
          <ToggleField
            label="Visível"
            checked={Boolean(draft["visible"])}
            onChange={(value) => set("visible", value)}
          />
          <RowActions onUp={onUp} onDown={onDown} onDelete={onDelete} />
        </div>
      </div>
      <TextField
        label="Nome do autor"
        value={String(draft["author_name"] ?? "")}
        onChange={(value) => set("author_name", value)}
      />
      <LocalizedField
        label="Cargo do autor"
        editor="input"
        value={draft["author_role"]}
        onChange={(value) => set("author_role", value)}
      />
      <LocalizedField
        label="Depoimento"
        editor="markdown"
        rows={4}
        value={draft["quote"]}
        onChange={(value) => set("quote", value)}
      />
      <SaveBar
        onSave={() =>
          onSave({
            author_name: draft["author_name"],
            author_role: draft["author_role"],
            quote: draft["quote"],
            visible: Boolean(draft["visible"]),
          })
        }
      />
    </AdminCard>
  );
}
