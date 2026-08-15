import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Paperclip, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import {
  AdminCard,
  PanelHeader,
  RowActions,
  SaveBar,
  SelectField,
  TextField,
  swapOrder,
  useAdminTable,
  type Row,
} from "./kit";
import { BLOCK_SECTION_LABEL_KEYS } from "./content-panels";
import { useSiteSettings, useSaveSettings } from "./settings-panel";

const BUCKET = "portfolio";

type BunnyFont = { slug: string; familyName: string; category: string };

async function fetchBunnyFonts(): Promise<BunnyFont[]> {
  const res = await fetch("https://fonts.bunny.net/list");
  if (!res.ok) throw new Error("font catalog request failed");
  const data = (await res.json()) as Record<string, { familyName: string; category: string }>;
  return Object.entries(data)
    .map(([slug, meta]) => ({ slug, familyName: meta.familyName, category: meta.category }))
    .sort((a, b) => a.familyName.localeCompare(b.familyName));
}

function useFontCatalog() {
  return useQuery({
    queryKey: ["bunny-fonts"],
    queryFn: fetchBunnyFonts,
    staleTime: Infinity,
    retry: 1,
  });
}

/** Color swatch + hex input kept in sync. Accepts any valid CSS color, but the swatch only reflects hex values. */
function ColorField({
  label,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
}) {
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  return (
    <div className="space-y-1.5">
      <Label className="mono-label">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isHex ? value : defaultValue}
          onChange={(event) => onChange(event.target.value)}
          className="size-10 shrink-0 cursor-pointer rounded-md border border-input bg-background p-0.5"
        />
        <input
          value={value}
          placeholder={defaultValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-xs"
        />
      </div>
    </div>
  );
}

function FontSelect({
  label,
  value,
  fonts,
  categories,
  onChange,
  defaultLabel,
}: {
  label: string;
  value: string;
  fonts: BunnyFont[];
  categories: string[];
  onChange: (value: string) => void;
  defaultLabel: string;
}) {
  const filtered = fonts.filter((font) => categories.includes(font.category));
  return (
    <div className="space-y-1.5">
      <span className="mono-label">{label}</span>
      <SelectField value={value} onChange={onChange}>
        <option value="">{defaultLabel}</option>
        {filtered.map((font) => (
          <option key={font.slug} value={font.familyName}>
            {font.familyName}
          </option>
        ))}
      </SelectField>
    </div>
  );
}

function faviconPath(name: string) {
  const safe = name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  return `favicon/${Date.now().toString(36)}-${safe}`;
}

export function CustomizationPanel() {
  const { t } = useI18n();
  const { data: settings } = useSiteSettings();
  const save = useSaveSettings();
  const [draft, setDraft] = useState<Row>({});
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: fonts = [], isLoading: fontsLoading, isError: fontsFailed } = useFontCatalog();
  const sections = useAdminTable("site_sections");

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  if (!settings) return null;

  const set = (key: string, value: unknown) => setDraft((prev) => ({ ...prev, [key]: value }));

  const blockRows = sections.rows
    .filter((row) => row["type"] === "block" && (row["page_slug"] ?? "home") === "home")
    .sort((a, b) => Number(a["order"] ?? 0) - Number(b["order"] ?? 0));

  async function handleFaviconUpload(file: File) {
    setUploading(true);
    try {
      const path = faviconPath(file.name);
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (error) throw error;
      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      set("favicon_url", url);
    } catch (error) {
      toast.error((error as { message?: string }).message ?? t("admin.kit.genericError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PanelHeader title={t("admin.nav.customization")} hint={t("admin.customization.hint")} />

      <AdminCard>
        <h3 className="mono-label text-signal">{t("admin.customization.colors")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <ColorField
                label={t("admin.customization.accentLight")}
                value={String(draft["theme_accent_light"] ?? "")}
                defaultValue="#4ade80"
                onChange={(value) => set("theme_accent_light", value)}
              />
            </div>
            {draft["theme_accent_light"] ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 shrink-0"
                title={t("admin.customization.reset")}
                onClick={() => set("theme_accent_light", null)}
              >
                <RotateCcw className="size-3.5" />
              </Button>
            ) : null}
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <ColorField
                label={t("admin.customization.accentDark")}
                value={String(draft["theme_accent_dark"] ?? "")}
                defaultValue="#4ade80"
                onChange={(value) => set("theme_accent_dark", value)}
              />
            </div>
            {draft["theme_accent_dark"] ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 shrink-0"
                title={t("admin.customization.reset")}
                onClick={() => set("theme_accent_dark", null)}
              >
                <RotateCcw className="size-3.5" />
              </Button>
            ) : null}
          </div>
        </div>

        <h3 className="mono-label text-signal">{t("admin.customization.fonts")}</h3>
        <p className="font-mono text-[11px] text-muted-foreground">
          {fontsLoading
            ? t("admin.customization.fontsLoading")
            : fontsFailed
              ? t("admin.customization.fontsFailed")
              : t("admin.customization.fontsHint")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FontSelect
            label={t("admin.customization.fontSans")}
            value={String(draft["font_sans"] ?? "")}
            fonts={fonts}
            categories={["sans-serif", "serif", "display", "handwriting"]}
            defaultLabel={`${t("admin.customization.fontDefault")} (Inter)`}
            onChange={(value) => set("font_sans", value || null)}
          />
          <FontSelect
            label={t("admin.customization.fontMono")}
            value={String(draft["font_mono"] ?? "")}
            fonts={fonts}
            categories={["monospace"]}
            defaultLabel={`${t("admin.customization.fontDefault")} (JetBrains Mono)`}
            onChange={(value) => set("font_mono", value || null)}
          />
        </div>

        <h3 className="mono-label text-signal">{t("admin.customization.browserTab")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("admin.customization.siteTitle")}
            value={String(draft["site_title"] ?? "")}
            placeholder={t("admin.customization.siteTitlePlaceholder")}
            onChange={(value) => set("site_title", value)}
          />
          <div className="space-y-1.5">
            <TextField
              label={t("admin.customization.favicon")}
              value={String(draft["favicon_url"] ?? "")}
              onChange={(value) => set("favicon_url", value)}
            />
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFaviconUpload(file);
                event.target.value = "";
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                className="h-8 font-mono text-[11px]"
                onClick={() => inputRef.current?.click()}
              >
                <Paperclip className="size-3" />{" "}
                {uploading
                  ? t("admin.customization.uploading")
                  : t("admin.customization.uploadFavicon")}
              </Button>
              {draft["favicon_url"] ? (
                <img
                  src={String(draft["favicon_url"])}
                  alt=""
                  className="size-8 shrink-0 rounded-sm border border-border object-cover"
                />
              ) : null}
            </div>
          </div>
        </div>

        <SaveBar
          onSave={() =>
            void save(String(settings["id"]), {
              theme_accent_light: draft["theme_accent_light"] || null,
              theme_accent_dark: draft["theme_accent_dark"] || null,
              font_sans: draft["font_sans"] || null,
              font_mono: draft["font_mono"] || null,
              site_title: draft["site_title"] || null,
              favicon_url: draft["favicon_url"] || null,
            })
          }
        />
      </AdminCard>

      <AdminCard>
        <h3 className="mono-label text-signal">{t("admin.customization.sectionOrder")}</h3>
        <p className="font-mono text-[11px] text-muted-foreground">
          {t("admin.customization.sectionOrderHint")}
        </p>
        <div className="space-y-2">
          {blockRows.map((row, index) => {
            const key = String(row["section_key"] ?? "");
            const labelKey = BLOCK_SECTION_LABEL_KEYS[key];
            return (
              <div
                key={row["id"]}
                className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5"
              >
                <span className="font-mono text-xs">{labelKey ? t(labelKey) : key}</span>
                <RowActions
                  onUp={
                    index > 0
                      ? () =>
                          swapOrder("site_sections", row, blockRows[index - 1]!, sections.refresh)
                      : undefined
                  }
                  onDown={
                    index < blockRows.length - 1
                      ? () =>
                          swapOrder("site_sections", row, blockRows[index + 1]!, sections.refresh)
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </AdminCard>
    </div>
  );
}
