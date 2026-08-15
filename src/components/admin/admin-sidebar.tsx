import { useEffect, useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { AnalyticsPanel } from "./analytics-panel";
import { MessagesPanel } from "./messages-panel";
import { PagesPanel } from "./pages-panel";
import { LabelsPanel } from "./labels-panel";

export type AdminLeaf = { id: string; label: string; render: () => ReactNode };
export type AdminGroup = { id: string; label: string; items: AdminLeaf[] };

const SYSTEM_EXTRA: Record<string, AdminLeaf[]> = {
  home: [{ id: "testimonials", label: "depoimentos", render: () => <TestimonialsPanel /> }],
  about: [
    { id: "timeline", label: "linha do tempo", render: () => <TimelinePanel /> },
    { id: "certifications", label: "certificados", render: () => <CertificationsPanel /> },
  ],
  projects: [
    { id: "projects", label: "projetos", render: () => <ProjectsPanel /> },
    { id: "project-labels", label: "rótulos de projeto", render: () => <ProjectLabelsPanel /> },
    { id: "case-studies", label: "estudos de caso", render: () => <CaseStudiesPanel /> },
  ],
  blog: [{ id: "posts", label: "posts", render: () => <BlogPanel /> }],
  contact: [{ id: "messages", label: "mensagens", render: () => <MessagesPanel /> }],
};

const GLOBAL_ITEMS_BASE: Omit<AdminLeaf, "render">[] = [
  { id: "pages", label: "páginas" },
  { id: "labels", label: "rótulo" },
  { id: "settings", label: "configurações" },
  { id: "analytics", label: "análises" },
];

export type ActiveLeaf = { group: string; item: string };

/** Builds the accordion tree: one group per site page (system + custom), plus a "geral" group. */
export function useAdminNav(onSelectPage: (slug: string) => void) {
  const pages = useAdminTable("site_pages");
  const ordered = [...pages.rows].sort((a, b) => Number(a["order"] ?? 0) - Number(b["order"] ?? 0));

  const pageGroups: AdminGroup[] = ordered.map((page) => {
    const slug = String(page["slug"]);
    const label = String((page["title"] as Row)?.["pt"] ?? slug);
    const items: AdminLeaf[] = [
      { id: "sections", label: "seções", render: () => <SectionsPanel pageSlug={slug} /> },
      ...(SYSTEM_EXTRA[slug] ?? []),
    ];
    return { id: slug, label, items };
  });

  const globalGroup: AdminGroup = {
    id: "global",
    label: "geral",
    items: GLOBAL_ITEMS_BASE.map((entry) => ({
      ...entry,
      render:
        entry.id === "pages"
          ? () => <PagesPanel onSelectPage={onSelectPage} />
          : entry.id === "labels"
            ? () => <LabelsPanel />
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
