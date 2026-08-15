import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TECH_STACK_OPTIONS, getTechIcon } from "@/lib/tech-stack";
import { useI18n } from "@/lib/i18n";

export function TechStackPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const selected = new Set(value);
  const filtered = TECH_STACK_OPTIONS.filter(
    (option) =>
      !selected.has(option.name) && option.name.toLowerCase().includes(query.toLowerCase()),
  );

  function add(name: string) {
    onChange([...value, name]);
  }

  function remove(name: string) {
    onChange(value.filter((item) => item !== name));
  }

  return (
    <div className="space-y-2">
      <Label className="mono-label">{t("admin.techStack.label")}</Label>

      {value.length ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((name) => {
            const Icon = getTechIcon(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => remove(name)}
                className="flex items-center gap-1.5 rounded-md border border-signal/40 bg-signal/10 px-2.5 py-1.5 font-mono text-xs text-signal transition-colors hover:border-destructive/60 hover:text-destructive"
              >
                <Icon className="size-3.5" />
                {name}
                <X className="size-3" />
              </button>
            );
          })}
        </div>
      ) : (
        <p className="font-mono text-[11px] text-muted-foreground">
          {t("admin.techStack.empty")}
        </p>
      )}

      <Input
        value={query}
        placeholder={t("admin.techStack.searchPlaceholder")}
        onChange={(event) => setQuery(event.target.value)}
        className="h-9 font-mono text-xs"
      />

      <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto rounded-md border border-border p-2 sm:grid-cols-3">
        {filtered.map((option) => (
          <button
            key={option.name}
            type="button"
            onClick={() => add(option.name)}
            className="flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-left font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-signal"
          >
            <option.icon className="size-3.5 shrink-0" />
            <span className="truncate">{option.name}</span>
          </button>
        ))}
        {filtered.length === 0 ? (
          <p className="col-span-full py-2 text-center font-mono text-xs text-muted-foreground">
            {t("admin.techStack.noResults")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
