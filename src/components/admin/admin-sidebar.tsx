import { useEffect, useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useAdminTable, type Row } from "./kit";
import {
  CertificationsPanel,
  SectionsPanel,
  TestimonialsPanel,
  TimelinePanel,
} from "./content-panels";
import { BlogPanel, CaseStudiesPanel } from "./writing-panels";
import { ProjectsPanel } from "./projects-panel";
import { ProjectLabelsPanel } from "./project-labels-panel";
import { SettingsPanel } from "./settings-panel";
import { CustomizationPanel } from "./customization-panel";
import { AnalyticsPanel } from "./analytics-panel";
import { MessagesPanel } from "./messages-panel";
import { PagesPanel } from "./pages-panel";
import { LabelsPanel } from "./labels-panel";

export type AdminLeaf = { id: string; label: string; render: () => ReactNode };
export type AdminGroup = { id: string; label: string; items: AdminLeaf[] };

type AdminLeafDef = { id: string; labelKey: TranslationKey; render: () => ReactNode };

const SYSTEM_EXTRA: Record<string, AdminLeafDef[]> = {
  home: [
    { id: "testimonials", labelKey: "admin.nav.testimonials", render: () => <TestimonialsPanel /> },
  ],
  about: [
    { id: "timeline", labelKey: "admin.nav.timeline", render: () => <TimelinePanel /> },
    {
      id: "certifications",
      labelKey: "admin.nav.certifications",
      render: () => <CertificationsPanel />,
    },
  ],
  projects: [
    { id: "projects", labelKey: "admin.nav.projects", render: () => <ProjectsPanel /> },
    {
      id: "project-labels",
      labelKey: "admin.nav.projectLabels",
      render: () => <ProjectLabelsPanel />,
    },
    { id: "case-studies", labelKey: "admin.nav.caseStudies", render: () => <CaseStudiesPanel /> },
  ],
  blog: [{ id: "posts", labelKey: "admin.nav.posts", render: () => <BlogPanel /> }],
  contact: [{ id: "messages", labelKey: "admin.nav.messages", render: () => <MessagesPanel /> }],
};

const GLOBAL_ITEMS_BASE: { id: string; labelKey: TranslationKey }[] = [
  { id: "pages", labelKey: "admin.nav.pages" },
  { id: "labels", labelKey: "admin.nav.labels" },
  { id: "customization", labelKey: "admin.nav.customization" },
  { id: "settings", labelKey: "admin.nav.settings" },
  { id: "analytics", labelKey: "admin.nav.analytics" },
];

export type ActiveLeaf = { group: string; item: string };

/** Builds the accordion tree: one group per site page (system + custom), plus a "geral" group. */
export function useAdminNav(onSelectPage: (slug: string) => void) {
  const { t } = useI18n();
  const pages = useAdminTable("site_pages");
  const ordered = [...pages.rows].sort((a, b) => Number(a["order"] ?? 0) - Number(b["order"] ?? 0));

  const pageGroups: AdminGroup[] = ordered.map((page) => {
    const slug = String(page["slug"]);
    const label = String((page["title"] as Row)?.["pt"] ?? slug);
    const items: AdminLeaf[] = [
      {
        id: "sections",
        label: t("admin.nav.sections"),
        render: () => <SectionsPanel pageSlug={slug} />,
      },
      ...(SYSTEM_EXTRA[slug] ?? []).map((entry) => ({
        id: entry.id,
        label: t(entry.labelKey),
        render: entry.render,
      })),
    ];
    return { id: slug, label, items };
  });

  const globalGroup: AdminGroup = {
    id: "global",
    label: t("admin.nav.general"),
    items: GLOBAL_ITEMS_BASE.map((entry) => ({
      id: entry.id,
      label: t(entry.labelKey),
      render:
        entry.id === "pages"
          ? () => <PagesPanel onSelectPage={onSelectPage} />
          : entry.id === "labels"
            ? () => <LabelsPanel />
            : entry.id === "customization"
              ? () => <CustomizationPanel />
              : entry.id === "settings"
                ? () => <SettingsPanel />
                : () => <AnalyticsPanel />,
    })),
  };

  return { groups: [...pageGroups, globalGroup], loading: pages.isLoading };
}

export function AdminSidebar({
  groups,
  active,
  onSelect,
}: {
  groups: AdminGroup[];
  active: ActiveLeaf;
  onSelect: (leaf: ActiveLeaf) => void;
}) {
  // Radix Accordion is uncontrolled by default (`defaultValue` only applies
  // once), so switching pages via PagesPanel or code never re-expanded the
  // right group. Controlled state keeps it in sync while still letting the
  // admin freely expand/collapse groups by hand.
  const [openGroup, setOpenGroup] = useState(active.group);
  useEffect(() => setOpenGroup(active.group), [active.group]);

  return (
    <nav className="panel shrink-0 overflow-hidden lg:w-64">
      <Accordion
        type="single"
        collapsible
        value={openGroup}
        onValueChange={(value) => setOpenGroup(value)}
        className="w-full"
      >
        {groups.map((group) => (
          <AccordionItem key={group.id} value={group.id} className="border-border px-2">
            <AccordionTrigger className="px-1.5 font-mono text-xs uppercase tracking-wide text-foreground hover:no-underline">
              {group.label}
            </AccordionTrigger>
            <AccordionContent className="px-0">
              <ul className="space-y-0.5 pb-1">
                {group.items.map((item) => {
                  const isActive = active.group === group.id && active.item === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelect({ group: group.id, item: item.id })}
                        className={`block w-full rounded-sm px-2.5 py-1.5 text-left font-mono text-[11px] transition-colors ${
                          isActive
                            ? "bg-signal/10 text-signal"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </nav>
  );
}
