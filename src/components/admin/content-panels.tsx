import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n, type TranslationKey } from "@/lib/i18n";
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

const LAYOUTS: { value: string; labelKey: TranslationKey }[] = [
  { value: "vertical", labelKey: "admin.content.layoutVertical" },
  { value: "horizontal", labelKey: "admin.content.layoutHorizontal" },
  { value: "carousel", labelKey: "admin.content.layoutCarousel" },
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

export const BLOCK_SECTION_LABEL_KEYS: Record<string, TranslationKey> = {
  activity: "admin.content.blockActivity",
  stack: "admin.content.blockStack",
  featured: "admin.content.blockFeatured",
  testimonials: "admin.content.blockTestimonials",
  blog: "admin.content.blockBlog",
};

function slugifySectionKey(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SectionsPanel({ pageSlug }: { pageSlug: string }) {
  const { t } = useI18n();
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
      toast.error(t("admin.content.invalidKey"));
      return;
    }
    if (table.rows.some((row) => row["section_key"] === section_key)) {
      toast.error(t("admin.content.keyExists"));
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
      toast.error(error.message ?? t("admin.content.deleteSectionsFailed"));
      return;
    }
    toast.success(t("admin.content.sectionsDeleted"));
    table.refresh();
    blocksTable.refresh();
  }

  return (
    <div className="space-y-4">
      <PanelHeader
        title="sections"
        hint={t("admin.content.sectionsHint")}
        action={
          <div className="flex gap-2">
            {customRows.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                className="h-9 font-mono text-xs text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmClearOpen(true)}
              >
                <Trash2 className="size-3.5" /> {t("admin.content.deleteAllCustom")}
              </Button>
            ) : null}
            <Button size="sm" className="h-9 font-mono text-xs" onClick={() => setPromptOpen(true)}>
              <Plus className="size-3.5" /> {t("admin.content.addSection")}
            </Button>
          </div>
        }
      />
      <PromptDialog
        open={promptOpen}
        title={t("admin.content.newSection")}
        description={t("admin.content.newSectionDescription")}
        placeholder="cta-newsletter"
        confirmLabel={t("admin.pages.create")}
        onOpenChange={setPromptOpen}
        onSubmit={addSection}
      />
      <ConfirmDialog
        open={confirmClearOpen}
        title={t("admin.content.deleteCustomTitle", { count: customRows.length })}
        description={t("admin.content.deleteCustomDescription")}
        confirmLabel={t("admin.content.deleteAll")}
        onOpenChange={setConfirmClearOpen}
        onConfirm={() => void clearCustomSections()}
      />
      {rows.length === 0 ? <EmptyState label={t("admin.content.emptySections")} /> : null}
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
  const { t } = useI18n();
  const { draft, set } = useDraft(row);
  const isCustom = row["type"] === "custom";
  const isBlock = row["type"] === "block";
  const sectionKey = String(row["section_key"] ?? "");
  const blockLabelKey = BLOCK_SECTION_LABEL_KEYS[sectionKey];

  if (isBlock) {
    return (
      <AdminCard>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-mono text-xs text-signal">
              {blockLabelKey ? t(blockLabelKey) : sectionKey}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {t("admin.content.fixedBlock", { key: sectionKey })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ToggleField
              label={t("admin.content.visible")}
              checked={Boolean(draft["visible"])}
              onChange={(value) => {
                set("visible", value);
                onSave({ visible: value });
              }}
            />
            <RowActions onUp={onUp} onDown={onDown} />
          </div>
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
      {isCustom && pages.length > 0 ? (
        <div className="space-y-1.5">
          <span className="mono-label">{t("admin.labels.page")}</span>
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
        label={t("admin.content.title")}
        editor="input"
        value={draft["title"]}
        onChange={(value) => set("title", value)}
      />
      <LocalizedField
        label={t("admin.content.subtitle")}
        editor="input"
        value={draft["subtitle"]}
        onChange={(value) => set("subtitle", value)}
      />
      <LocalizedField
        label={t("admin.content.body")}
        editor="markdown"
        rows={8}
        value={draft["body"]}
        onChange={(value) => set("body", value)}
      />
      <p className="font-mono text-[11px] text-muted-foreground">
        {t("admin.content.markdownHint")}
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
  const { t } = useI18n();
  const blocks = blocksTable.rows
    .filter((block) => block["section_id"] === sectionId)
    .sort((a, b) => Number(a["order"] ?? 0) - Number(b["order"] ?? 0));

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="mono-label">{t("admin.content.divsCount", { count: blocks.length })}</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 font-mono text-xs"
          onClick={() => blocksTable.insert({ section_id: sectionId, order: nextOrder(blocks) })}
        >
          <Plus className="size-3.5" /> {t("admin.content.addDiv")}
        </Button>
      </div>
      {blocks.length > 1 ? (
        <div className="space-y-1.5">
          <span className="mono-label">{t("admin.content.layout")}</span>
          <SelectField value={layout} onChange={onLayoutChange} className="sm:w-64">
            {LAYOUTS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
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
  const { t } = useI18n();
  const { draft, set } = useDraft(block);
  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">
          {String(
            (draft["title"] as Row)?.["pt"] ||
              (draft["title"] as Row)?.["en"] ||
              t("admin.content.untitled"),
          )}
        </span>
        <RowActions onUp={onUp} onDown={onDown} onDelete={onDelete} />
      </div>
      <LocalizedField
        label={t("admin.content.title")}
        editor="input"
        value={draft["title"]}
        onChange={(value) => set("title", value)}
      />
      <LocalizedField
        label={t("admin.content.body")}
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

const TIMELINE_TYPES: { value: "work" | "study"; labelKey: TranslationKey }[] = [
  { value: "work", labelKey: "admin.content.timelineWork" },
  { value: "study", labelKey: "admin.content.timelineStudy" },
];

export function TimelinePanel() {
  const { t } = useI18n();
  const table = useAdminTable("career_timeline");

  function addEntry(type: "work" | "study") {
    table.insert({
      institution: t("admin.content.newEntry"),
      type,
      start_date: new Date().toISOString().slice(0, 10),
      order: nextOrder(table.rows),
    });
  }

  return (
    <div className="space-y-4">
      <PanelHeader
        title="career_timeline"
        hint={t("admin.content.timelineHint")}
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 font-mono text-xs"
              onClick={() => addEntry("study")}
            >
              <Plus className="size-3.5" /> {t("admin.content.timelineStudy")}
            </Button>
            <Button size="sm" className="h-9 font-mono text-xs" onClick={() => addEntry("work")}>
              <Plus className="size-3.5" /> {t("admin.content.timelineWork")}
            </Button>
          </div>
        }
      />
      {table.rows.length === 0 ? <EmptyState label={t("admin.content.emptyTimeline")} /> : null}
      {TIMELINE_TYPES.map((group) => {
        const rows = table.rows.filter((row) => (row["type"] ?? "work") === group.value);
        if (rows.length === 0) return null;
        return (
          <div key={group.value} className="space-y-4">
            <h3 className="mono-label text-signal">{t(group.labelKey)}</h3>
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
  const { t } = useI18n();
  const { draft, set } = useDraft(row);
  return (
    <AdminCard>
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs text-signal">{String(draft["institution"] ?? "")}</p>
        <div className="flex items-center gap-2">
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
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <span className="mono-label">{t("admin.content.type")}</span>
          <SelectField
            value={String(draft["type"] ?? "work")}
            onChange={(value) => set("type", value)}
          >
            {TIMELINE_TYPES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {t(entry.labelKey)}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField
          label={t("admin.content.institution")}
          value={String(draft["institution"] ?? "")}
          onChange={(value) => set("institution", value)}
        />
        <TextField
          label={t("admin.content.startDate")}
          type="date"
          value={String(draft["start_date"] ?? "")}
          onChange={(value) => set("start_date", value)}
        />
        <div className="space-y-1.5">
          <TextField
            label={t("admin.content.endDate")}
            type="date"
            value={String(draft["end_date"] ?? "")}
            onChange={(value) => set("end_date", value)}
          />
          <p className="font-mono text-[10px] text-muted-foreground">
            {t("admin.content.emptyMeansPresent")}
          </p>
        </div>
      </div>
      <LocalizedField
        label={t("admin.content.title")}
        editor="input"
        value={draft["title"]}
        onChange={(value) => set("title", value)}
      />
      <LocalizedField
        label={t("admin.content.description")}
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
  const { t } = useI18n();
  const table = useAdminTable("certifications");

  return (
    <div className="space-y-4">
      <PanelHeader
        title="certifications"
        hint={t("admin.content.certificationsHint")}
        action={
          <Button
            size="sm"
            className="h-9 font-mono text-xs"
            onClick={() =>
              table.insert({
                name: t("admin.content.newCertification"),
                order: nextOrder(table.rows),
              })
            }
          >
            <Plus className="size-3.5" /> {t("admin.content.addCertification")}
          </Button>
        }
      />
      {table.rows.length === 0 ? (
        <EmptyState label={t("admin.content.emptyCertifications")} />
      ) : null}
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
  const { t } = useI18n();
  const { draft, set } = useDraft(row);
  return (
    <AdminCard>
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs text-signal">{String(draft["name"] ?? "")}</p>
        <div className="flex items-center gap-2">
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
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t("admin.content.name")}
          value={String(draft["name"] ?? "")}
          onChange={(value) => set("name", value)}
        />
        <TextField
          label={t("admin.content.issuer")}
          value={String(draft["issuer"] ?? "")}
          onChange={(value) => set("issuer", value)}
        />
        <TextField
          label={t("admin.content.date")}
          type="date"
          value={String(draft["date"] ?? "")}
          onChange={(value) => set("date", value)}
        />
        <TextField
          label={t("admin.content.credentialUrl")}
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
  const { t } = useI18n();
  const table = useAdminTable("testimonials");

  return (
    <div className="space-y-4">
      <PanelHeader
        title="testimonials"
        hint={t("admin.content.testimonialsHint")}
        action={
          <Button
            size="sm"
            className="h-9 font-mono text-xs"
            onClick={() =>
              table.insert({
                author_name: t("admin.content.newAuthor"),
                order: nextOrder(table.rows),
              })
            }
          >
            <Plus className="size-3.5" /> {t("admin.content.addTestimonial")}
          </Button>
        }
      />
      {table.rows.length === 0 ? <EmptyState label={t("admin.content.emptyTestimonials")} /> : null}
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
  const { t } = useI18n();
  const { draft, set } = useDraft(row);
  return (
    <AdminCard>
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs text-signal">{String(draft["author_name"] ?? "")}</p>
        <div className="flex items-center gap-2">
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
      <TextField
        label={t("admin.content.authorName")}
        value={String(draft["author_name"] ?? "")}
        onChange={(value) => set("author_name", value)}
      />
      <LocalizedField
        label={t("admin.content.authorRole")}
        editor="input"
        value={draft["author_role"]}
        onChange={(value) => set("author_role", value)}
      />
      <LocalizedField
        label={t("admin.content.quote")}
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
