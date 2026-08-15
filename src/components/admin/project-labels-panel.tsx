import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  LABEL_COLORS,
  LABEL_SWATCH_CLASSES,
  isPresetLabelColor,
  labelColorClass,
  labelColorStyle,
} from "@/lib/projects";
import {
  AdminCard,
  EmptyState,
  LocalizedField,
  PanelHeader,
  RowActions,
  SaveBar,
  swapOrder,
  useAdminTable,
  type Row,
} from "./kit";

const HEX_RE = /^#[0-9a-f]{6}$/i;

function useDraft(row: Row) {
  const [draft, setDraft] = useState<Row>(row);
  useEffect(() => setDraft(row), [row]);
  const set = (key: string, value: unknown) => setDraft((prev) => ({ ...prev, [key]: value }));
  return { draft, set };
}

function nextOrder(rows: Row[]) {
  return rows.reduce((max, row) => Math.max(max, Number(row["order"] ?? 0)), 0) + 1;
}

export function ProjectLabelsPanel() {
  const table = useAdminTable("project_labels");
  const rows = table.rows;

  return (
    <div className="space-y-4">
      <PanelHeader
        title="rótulos de projeto"
        hint="As categorias que aparecem como badge nos cards de projeto (ex: Produção, Estudo, Experimento). Renomeie, recolora, reordene ou crie novas."
        action={
          <Button
            size="sm"
            className="h-9 font-mono text-xs"
            onClick={() => table.insert({ color: "signal", order: nextOrder(rows) })}
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
          onSave={(values) => table.update(row["id"], values)}
          onDelete={() => table.remove(row["id"])}
          onUp={
            index > 0
              ? () => swapOrder("project_labels", row, rows[index - 1]!, table.refresh)
              : undefined
          }
          onDown={
            index < rows.length - 1
              ? () => swapOrder("project_labels", row, rows[index + 1]!, table.refresh)
              : undefined
          }
        />
      ))}
    </div>
  );
}

function LabelRow({
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
  const name = String((draft["name"] as Row)?.["pt"] || (draft["name"] as Row)?.["en"] || "");
  const color = String(draft["color"] ?? "signal");
  const isCustom = !isPresetLabelColor(color);
  const [hexInput, setHexInput] = useState(isCustom ? color : "#22c55e");

  useEffect(() => {
    if (isCustom) setHexInput(color);
  }, [color, isCustom]);

  return (
    <AdminCard>
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className={`font-mono text-[10px] ${labelColorClass(color)}`}
          style={labelColorStyle(color)}
        >
          {name || "novo rótulo"}
        </Badge>
        <RowActions onUp={onUp} onDown={onDown} onDelete={onDelete} />
      </div>
      <div className="space-y-1.5">
        <span className="mono-label">Cor</span>
        <div className="flex flex-wrap items-center gap-2">
          {LABEL_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => set("color", option)}
              aria-label={option}
              aria-pressed={color === option}
              className={`size-8 rounded-full border-2 transition-transform ${LABEL_SWATCH_CLASSES[option]} ${
                color === option ? "scale-110 border-foreground" : "border-transparent"
              }`}
            >
              <span className="sr-only">{option}</span>
            </button>
          ))}
          <label
            title="Cor personalizada"
            className={`relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 transition-transform ${
              isCustom ? "scale-110 border-foreground" : "border-transparent"
            }`}
            style={
              isCustom
                ? { backgroundColor: color }
                : { background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }
            }
          >
            <span className="sr-only">Cor personalizada</span>
            <input
              type="color"
              value={isCustom ? color : hexInput}
              onChange={(event) => {
                setHexInput(event.target.value);
                set("color", event.target.value);
              }}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </label>
          <Input
            value={hexInput}
            onChange={(event) => {
              const value = event.target.value;
              setHexInput(value);
              if (HEX_RE.test(value)) set("color", value.toLowerCase());
            }}
            placeholder="#22c55e"
            maxLength={7}
            className="h-8 w-24 font-mono text-xs"
          />
        </div>
      </div>
      <LocalizedField
        label="Nome"
        editor="input"
        value={draft["name"]}
        onChange={(value) => set("name", value)}
      />
      <SaveBar
        onSave={() =>
          onSave({
            name: draft["name"],
            color: draft["color"] ?? "signal",
          })
        }
      />
    </AdminCard>
  );
}
