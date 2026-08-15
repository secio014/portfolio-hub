import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { SiteLayout, Section } from "@/components/site/SiteLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ProjectGrid } from "@/components/site/ProjectGrid";
import { Markdown } from "@/components/site/Markdown";
import { SectionBlocks } from "@/components/site/SectionBlocks";
import { useI18n, localized } from "@/lib/i18n";
import { buildProjects } from "@/lib/projects";
import {
  caseStudiesQuery,
  projectLabelsQuery,
  projectsQuery,
  reposQuery,
  sectionBlocksQuery,
  sectionsQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Pedro Schmitz Sécio" },
      {
        name: "description",
        content:
          "Every project, synced from GitHub and enriched with case studies: production apps, studies and experiments.",
      },
      { property: "og:title", content: "Projects — Pedro Schmitz Sécio" },
      {
        property: "og:description",
        content: "Production apps, studies and experiments, filterable by technology.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { t, locale } = useI18n();
  const { data: repos = [] } = useQuery(reposQuery);
  const { data: manual = [] } = useQuery(projectsQuery);
  const { data: cases = [] } = useQuery(caseStudiesQuery);
  const { data: sections = [] } = useQuery(sectionsQuery);
  const { data: labels = [] } = useQuery(projectLabelsQuery);
  const { data: sectionBlocks = [] } = useQuery(sectionBlocksQuery);
  const blocksFor = (sectionId: string | undefined) =>
    sectionId ? sectionBlocks.filter((block) => block.section_id === sectionId) : [];

  const projects = useMemo(
    () => buildProjects(repos, manual, cases, locale, labels),
    [repos, manual, cases, locale, labels],
  );
  const customSections = sections.filter(
    (section) => section.page_slug === "projects" && section.type === "custom" && section.visible,
  );

  return (
    <SiteLayout page="projects">
      <Section>
        <SectionHeading index="01" title={t("nav.projects")} subtitle={t("section.featuredSub")} />
        <ProjectGrid projects={projects} withFilters />
      </Section>

      {customSections.map((section, index) => (
        <Section key={section.id} className="border-t border-border">
          <SectionHeading
            index={String(2 + index).padStart(2, "0")}
            title={localized(section.title, locale) || section.section_key}
            {...(localized(section.subtitle, locale)
              ? { subtitle: localized(section.subtitle, locale) }
              : {})}
          />
          <Markdown value={localized(section.body, locale)} />
          {blocksFor(section.id).length ? (
            <div className="mt-6">
              <SectionBlocks
                blocks={blocksFor(section.id)}
                layout={String(section.layout ?? "vertical")}
                locale={locale}
              />
            </div>
          ) : null}
        </Section>
      ))}
    </SiteLayout>
  );
}
