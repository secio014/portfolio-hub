import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AdminCard,
  EmptyState,
  LocalizedField,
  PanelHeader,
  PromptDialog,
  RowActions,
  SaveBar,
  ToggleField,
  swapOrder,
  useAdminTable,
  type Row,
} from "./kit";

function slugifyPage(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nextOrder(rows: Row[]) {
  return rows.reduce((max, row) => Math.max(max, Number(row["order"] ?? 0)), 0) + 1;
}

/**
 * Manages custom pages: creates them (they immediately render at /p/<slug>
 * and appear in site navigation), lets the admin rename, reorder, hide from
 * nav, or delete them. System pages (Home, About, Projects, Blog, Contact)
 * are always listed but locked — their sections live under their own
 * accordion group instead of here.
 */
export function PagesPanel({ onSelectPage }: { onSelectPage?: (slug: string) => void }) {
  const table = useAdminTable("site_pages");
  const [promptOpen, setPromptOpen] = useState(false);
  const custom = table.rows.filter((row) => !row["is_system"]);
  const system = table.rows.filter((row) => row["is_system"]);

  function addPage(input: string) {
    const slug = slugifyPage(input);
    if (!slug) {
      toast.error("Slug inválido");
      return;
    }
    if (table.rows.some((row) => row["slug"] === slug)) {
      toast.error("Já existe uma página com esse slug");
      return;
    }
    void (async () => {
      const ok = await table.insert({
        slug,
        title: { pt: input.trim(), en: input.trim(), es: input.trim() },
        nav_visible: true,
        is_system: false,
        order: nextOrder(table.rows),
      });
      if (ok) onSelectPage?.(slug);
    })();
  }

  return (
    <div className="space-y-4">
      <PanelHeader
        title="pages"
        hint="Páginas do site. Crie uma página nova para publicar em /p/<slug> e adicioná-la automaticamente ao menu."
        action={
          <Button size="sm" className="h-9 font-mono text-xs" onClick={() => setPromptOpen(true)}>
            <Plus className="size-3.5" /> Nova página
          </Button>
        }
      />
      <PromptDialog
        open={promptOpen}
        title="Nova página"
        description="Nome da página (ex: Serviços). O endereço será gerado a partir dele."
        placeholder="Serviços"
        confirmLabel="Criar"
        onOpenChange={setPromptOpen}
        onSubmit={addPage}
      />

      <div className="space-y-2">
        <h3 className="mono-label text-signal">Páginas do sistema</h3>
        {system.map((row) => (
          <div
            key={row["id"]}
            className="panel flex items-center justify-between gap-2 p-3 font-mono text-xs"
          >
            <span>{String((row["title"] as Row)?.["pt"] ?? row["slug"])}</span>
            <span className="text-[10px] uppercase text-muted-foreground">
              /{row["slug"] === "home" ? "" : String(row["slug"])} · fixa
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="mono-label text-signal">Páginas customizadas</h3>
        {custom.length === 0 ? <EmptyState label="Nenhuma página customizada ainda." /> : null}
        {custom.map((row, index) => (
          <PageRow
            key={row["id"]}
            row={row}
            onSave={(values) => table.update(row["id"], values)}
            onDelete={() => table.remove(row["id"])}
            onOpen={() => onSelectPage?.(String(row["slug"]))}
            onUp={
              index > 0
                ? () => swapOrder("site_pages", row, custom[index - 1]!, table.refresh)
                : undefined
            }
            onDown={
              index < custom.length - 1
                ? () => swapOrder("site_pages", row, custom[index + 1]!, table.refresh)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

function PageRow({
  row,
  onSave,
  onDelete,
  onOpen,
  onUp,
  onDown,
}: {
  row: Row;
  onSave: (values: Row) => void;
  onDelete: () => void;
  onOpen: () => void;
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
}) {
  const [draft, setDraft] = useState<Row>(row);
  const set = (key: string, value: unknown) => setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <AdminCard>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="text-left font-mono text-xs text-signal hover:underline"
        >
          /p/{String(row["slug"])}
        </button>
        <div className="flex items-center gap-2">
          <ToggleField
            label="No menu"
            checked={Boolean(draft["nav_visible"])}
            onChange={(value) => set("nav_visible", value)}
          />
          <RowActions onUp={onUp} onDown={onDown} onDelete={onDelete} />
        </div>
      </div>
      <LocalizedField
        label="Nome (exibido no menu)"
        editor="input"
        value={draft["title"]}
        onChange={(value) => set("title", value)}
      />
      <SaveBar
        onSave={() =>
          onSave({
            title: draft["title"],
            nav_visible: Boolean(draft["nav_visible"]),
          })
        }
      />
    </AdminCard>
  );
}
