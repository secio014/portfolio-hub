import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, Section } from "@/components/site/SiteLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Markdown } from "@/components/site/Markdown";
import { SectionBlocks } from "@/components/site/SectionBlocks";
import { useI18n, localized } from "@/lib/i18n";
import { pagesQuery, sectionBlocksQuery, sectionsQuery } from "@/lib/queries";

export const Route = createFileRoute("/p/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.slug.replace(/-/g, " ")} — Pedro Schmitz Sécio` }],
  }),
  component: CustomPage,
});

function CustomPage() {
  const { slug } = Route.useParams();
  const { locale } = useI18n();
  const { data: pages = [], isLoading: pagesLoading } = useQuery(pagesQuery);
  const { data: sections = [], isLoading: sectionsLoading } = useQuery(sectionsQuery);
  const { data: sectionBlocks = [] } = useQuery(sectionBlocksQuery);
  const blocksFor = (sectionId: string | undefined) =>
    sectionId ? sectionBlocks.filter((block) => block.section_id === sectionId) : [];

  const page = pages.find((entry) => entry.slug === slug);
  if (!pagesLoading && !page) throw notFound();

  const pageSections = sections
    .filter(
      (section) => section.page_slug === slug && section.type === "custom" && section.visible,
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <SiteLayout page={`p/${slug}`} pageSlug={slug}>
      {page ? (
        <Section>
          <SectionHeading index="01" title={localized(page.title, locale) || page.slug} />
        </Section>
      ) : null}

      {pageSections.map((section, index) => (
        <Section key={section.id} className={index === 0 && !page ? "" : "border-t border-border"}>
          {section.title || section.subtitle ? (
            <SectionHeading
              index={String(index + 2).padStart(2, "0")}
              title={localized(section.title, locale) || section.section_key}
              {...(localized(section.subtitle, locale)
                ? { subtitle: localized(section.subtitle, locale) }
                : {})}
            />
          ) : null}
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

      {!sectionsLoading && pageSections.length === 0 ? (
        <Section>
          <p className="font-mono text-sm text-muted-foreground">
            {locale === "pt"
              ? "Nenhuma seção adicionada a esta página ainda."
              : locale === "es"
                ? "Aún no se agregaron secciones a esta página."
                : "No sections added to this page yet."}
          </p>
        </Section>
      ) : null}
    </SiteLayout>
  );
}
