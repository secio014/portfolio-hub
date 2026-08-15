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
  ToggleField,
  swapOrder,
  useAdminTable,
  type Row,
} from "./kit";

const PLACEMENTS: { value: string; label: string }[] = [
  { value: "header", label: "Cabeçalho (ao lado do logo)" },
  { value: "hero", label: "Destaque da home" },
  { value: "top", label: "Topo do conteúdo da página" },
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

export function LabelsPanel() {
  const table = useAdminTable("site_labels");
  const pages = useAdminTable("site_pages");
  const rows = table.rows;

  return (
    <div className="space-y-4">
      <PanelHeader
        title="rótulo"
        hint="Pequenos selos de status (ex: disponibilidade para trabalho). Crie quantos quiser, escolha o texto por idioma, a página e onde aparecem no site."
        action={
          <Button
            size="sm"
            className="h-9 font-mono text-xs"
            onClick={() =>
              table.insert({
                page_slug: pages.rows[0]?.["slug"] ?? "home",
                placement: "header",
                enabled: false,
                order: nextOrder(rows),
              })
            }
          >
            <Plus className="size-3.5" /> Adicionar rótulo
          </Button>
        }
      />
      {rows.length === 0 ? <EmptyState label="Nenhum rótulo ainda." /> : null}
      {rows.map((row, index) => (
        <LabelRow
          key={row["id"]}
          row={row}
          pages={pages.rows}
          onSave={(values) => table.update(row["id"], values)}
          onDelete={() => table.remove(row["id"])}
          onUp={
            index > 0
              ? () => swapOrder("site_labels", row, rows[index - 1]!, table.refresh)
              : undefined
          }
          onDown={
            index < rows.length - 1
              ? () => swapOrder("site_labels", row, rows[index + 1]!, table.refresh)
              : undefined
          }
        />
      ))}
    </div>
  );
}

function LabelRow({
  row,
  pages,
  onSave,
  onDelete,
  onUp,
  onDown,
}: {
  row: Row;
  pages: Row[];
  onSave: (values: Row) => void;
  onDelete: () => void;
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
}) {
  const { draft, set } = useDraft(row);

  return (
    <AdminCard>
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs text-signal">
          {String(
            (draft["text"] as Row)?.["pt"] || (draft["text"] as Row)?.["en"] || "novo rótulo",
          )}
        </p>
        <div className="flex items-center gap-2">
          <ToggleField
            label="Ativo"
            checked={Boolean(draft["enabled"])}
            onChange={(value) => set("enabled", value)}
          />
          <RowActions onUp={onUp} onDown={onDown} onDelete={onDelete} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="mono-label">Página</span>
          <SelectField
            value={String(draft["page_slug"] ?? "home")}
            onChange={(value) => set("page_slug", value)}
          >
            {pages.map((page) => (
              <option key={page["id"]} value={page["slug"]}>
                {String((page["title"] as Row)?.["pt"] ?? page["slug"])}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="space-y-1.5">
          <span className="mono-label">Onde no site</span>
          <SelectField
            value={String(draft["placement"] ?? "header")}
            onChange={(value) => set("placement", value)}
          >
            {PLACEMENTS.map((placement) => (
              <option key={placement.value} value={placement.value}>
                {placement.label}
              </option>
            ))}
          </SelectField>
        </div>
      </div>
      {String(draft["placement"] ?? "") === "hero" &&
      String(draft["page_slug"] ?? "") !== "home" ? (
        <p className="font-mono text-[11px] text-warn">
          O destaque (herói) só é exibido na página inicial — este rótulo não vai aparecer até que a
          página seja "Home".
        </p>
      ) : null}
      <LocalizedField
        label="Texto"
        editor="input"
        value={draft["text"]}
        onChange={(value) => set("text", value)}
      />
      <SaveBar
        onSave={() =>
          onSave({
            text: draft["text"],
            enabled: Boolean(draft["enabled"]),
            page_slug: draft["page_slug"] ?? "home",
            placement: draft["placement"] ?? "header",
          })
        }
      />
    </AdminCard>
  );
}
