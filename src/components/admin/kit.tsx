import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LOCALES, type Locale } from "@/lib/i18n";
import { MediaPickerDialog } from "./media-picker";

/** Loose accessor: admin panels touch many tables generically. */
export const db = supabase as unknown as {
  from: (table: string) => any;
};

export type Row = Record<string, any>;

export function useAdminTable(table: string, orderBy = "order", ascending = true) {
  const queryClient = useQueryClient();
  const key = ["admin", table];

  const query = useQuery<Row[]>({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db
        .from(table)
        .select("*")
        .order(orderBy, { ascending, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: [table] });
  }

  async function run(promise: PromiseLike<{ error: unknown }>, message: string) {
    const { error } = await promise;
    if (error) {
      toast.error((error as { message?: string }).message ?? "Algo deu errado");
      return false;
    }
    toast.success(message);
    refresh();
    return true;
  }

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    refresh,
    insert: (values: Row) => run(db.from(table).insert(values), "Criado"),
    /** Like `insert`, but also returns the created row (e.g. to get its new id). */
    insertAndReturn: async (values: Row): Promise<Row | null> => {
      const { data, error } = await db.from(table).insert(values).select().single();
      if (error) {
        toast.error((error as { message?: string }).message ?? "Algo deu errado");
        return null;
      }
      toast.success("Criado");
      refresh();
      return data as Row;
    },
    update: (id: string, values: Row) => run(db.from(table).update(values).eq("id", id), "Salvo"),
    remove: (id: string) => run(db.from(table).delete().eq("id", id), "Excluído"),
  };
}

/** Swaps the `order` value of two rows. */
export async function swapOrder(table: string, a: Row, b: Row, refresh: () => void) {
  await db
    .from(table)
    .update({ order: b["order"] ?? 0 })
    .eq("id", a["id"]);
  await db
    .from(table)
    .update({ order: a["order"] ?? 0 })
    .eq("id", b["id"]);
  refresh();
}

export function PanelHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-3">
      <div>
        <h2 className="font-mono text-sm font-bold tracking-tight">
          <span className="text-signal">$</span> {title}
        </h2>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({ children }: { children: ReactNode }) {
  return <div className="panel panel-glow space-y-4 p-4">{children}</div>;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="mono-label">{label}</Label>
      <Input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 font-mono text-xs"
      />
    </div>
  );
}

/** Native `<select>` with its own chevron, so the browser's default (often flush against the border) doesn't apply. */
export function SelectField({
  value,
  onChange,
  children,
  className = "",
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className="h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-8 font-mono text-xs"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span className="mono-label">{label}</span>
    </label>
  );
}

/** Per-language editor for a jsonb `{ en, pt, es }` column. */
export function LocalizedField({
  label,
  value,
  onChange,
  rows = 3,
  editor = "textarea",
}: {
  label: string;
  value: Row | null | undefined;
  onChange: (value: Row) => void;
  rows?: number;
  editor?: "textarea" | "input" | "markdown";
}) {
  const [locale, setLocale] = useState<Locale>("en");
  const current = String((value as Row | null)?.[locale] ?? "");

  function set(next: string) {
    onChange({ ...(value ?? {}), [locale]: next });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="mono-label">{label}</Label>
        <div className="flex overflow-hidden rounded-sm border border-border">
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              className={`px-2 py-0.5 font-mono text-[10px] uppercase transition-colors ${
                locale === code
                  ? "bg-signal text-signal-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
      {editor === "input" ? (
        <Input
          value={current}
          onChange={(event) => set(event.target.value)}
          className="h-10 font-mono text-xs"
        />
      ) : editor === "markdown" ? (
        <MarkdownEditor value={current} onChange={set} rows={rows} />
      ) : (
        <Textarea
          value={current}
          rows={rows}
          onChange={(event) => set(event.target.value)}
          className="font-mono text-xs"
        />
      )}
    </div>
  );
}

const MARKDOWN_ACTIONS: { label: string; wrap: [string, string] }[] = [
  { label: "B", wrap: ["**", "**"] },
  { label: "I", wrap: ["_", "_"] },
  { label: "H2", wrap: ["\n## ", "\n"] },
  { label: "code", wrap: ["`", "`"] },
  { label: "link", wrap: ["[", "](https://)"] },
  { label: "list", wrap: ["\n- ", ""] },
  { label: "quote", wrap: ["\n> ", "\n"] },
];

/** In-page replacement for `window.prompt`. Rendered inline, not a browser dialog. */
export function PromptDialog({
  open,
  title,
  description,
  placeholder,
  defaultValue = "",
  confirmLabel = "Confirmar",
  allowEmpty = false,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  allowEmpty?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  function submit() {
    if (!allowEmpty && !value.trim()) return;
    onOpenChange(false);
    onSubmit(value.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <Input
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          className="h-10 font-mono text-xs"
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="h-9 font-mono text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" className="h-9 font-mono text-xs" onClick={submit}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** In-page replacement for `window.confirm`. Rendered inline, not a browser dialog. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Excluir",
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-mono text-sm">{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-9 font-mono text-xs">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="h-9 bg-destructive font-mono text-xs text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function MarkdownEditor({
  value,
  onChange,
  rows = 12,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const [ref, setRef] = useState<HTMLTextAreaElement | null>(null);
  const [prompt, setPrompt] = useState<"code" | null>(null);
  const [media, setMedia] = useState<"image" | "video" | null>(null);

  function apply(prefix: string, suffix: string) {
    if (!ref) {
      onChange(`${value}${prefix}${suffix}`);
      return;
    }
    const start = ref.selectionStart;
    const end = ref.selectionEnd;
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      ref.focus();
      ref.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface px-2 py-1.5">
        {MARKDOWN_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => apply(action.wrap[0], action.wrap[1])}
            className="rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground transition-colors hover:bg-accent hover:text-signal"
          >
            {action.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPrompt("code")}
          className="rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground transition-colors hover:bg-accent hover:text-signal"
        >
          bloco de código
        </button>
        <button
          type="button"
          onClick={() => setMedia("image")}
          className="rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground transition-colors hover:bg-accent hover:text-signal"
        >
          imagem
        </button>
        <button
          type="button"
          onClick={() => setMedia("video")}
          className="rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground transition-colors hover:bg-accent hover:text-signal"
        >
          vídeo
        </button>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">markdown</span>
      </div>
      <Textarea
        ref={setRef}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-none border-0 font-mono text-xs focus-visible:ring-0"
      />
      <PromptDialog
        open={prompt === "code"}
        title="Bloco de código"
        description="Linguagem do bloco (ex: ts, python, bash). Deixe em branco para nenhuma."
        placeholder="ts"
        confirmLabel="Inserir"
        allowEmpty
        onOpenChange={(next) => setPrompt(next ? "code" : null)}
        onSubmit={(lang) => apply(`\n\`\`\`${lang}\n`, "\n```\n")}
      />
      {media ? (
        <MediaPickerDialog
          open={media !== null}
          kind={media}
          onOpenChange={(next) => setMedia(next ? media : null)}
          onInsert={(markdown) => apply(markdown, "")}
        />
      ) : null}
    </div>
  );
}

export function RowActions({
  onUp,
  onDown,
  onDelete,
}: {
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div className="flex items-center gap-1">
      {onUp ? (
        <Button type="button" variant="ghost" size="icon" className="size-7" onClick={onUp}>
          <ChevronUp className="size-3.5" />
        </Button>
      ) : null}
      {onDown ? (
        <Button type="button" variant="ghost" size="icon" className="size-7" onClick={onDown}>
          <ChevronDown className="size-3.5" />
        </Button>
      ) : null}
      {onDelete ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-3.5" />
          </Button>
          <ConfirmDialog
            open={confirmOpen}
            title="Excluir este registro?"
            description="Esta ação não pode ser desfeita."
            onOpenChange={setConfirmOpen}
            onConfirm={onDelete}
          />
        </>
      ) : null}
    </div>
  );
}

export function SaveBar({ onSave, children }: { onSave: () => void; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
      <div className="flex items-center gap-2">{children}</div>
      <Button type="button" size="sm" className="h-9 font-mono text-xs" onClick={onSave}>
        Salvar
      </Button>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <p className="panel px-4 py-8 text-center font-mono text-xs text-muted-foreground">{label}</p>
  );
}
