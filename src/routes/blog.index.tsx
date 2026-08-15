import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { SiteLayout, Section } from "@/components/site/SiteLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Markdown } from "@/components/site/Markdown";
import { SectionBlocks } from "@/components/site/SectionBlocks";
import { useI18n, localized } from "@/lib/i18n";
import { blogQuery, sectionBlocksQuery, sectionsQuery } from "@/lib/queries";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Writing — Pedro Schmitz Sécio" },
      {
        name: "description",
        content:
          "Articles on software engineering, TypeScript, cloud and the craft of building maintainable products.",
      },
      { property: "og:title", content: "Writing — Pedro Schmitz Sécio" },
      { property: "og:description", content: "Articles on software engineering and the craft." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { t, locale } = useI18n();
  const { data: posts = [] } = useQuery(blogQuery);
  const { data: sections = [] } = useQuery(sectionsQuery);
  const { data: sectionBlocks = [] } = useQuery(sectionBlocksQuery);
  const blocksFor = (sectionId: string | undefined) =>
    sectionId ? sectionBlocks.filter((block) => block.section_id === sectionId) : [];
  const customSections = sections.filter(
    (section) => section.page_slug === "blog" && section.type === "custom" && section.visible,
  );

  return (
    <SiteLayout page="blog">
      <Section>
        <SectionHeading index="01" title={t("section.blog")} />
        {posts.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <li key={post.id} className="panel flex flex-col p-4 sm:p-5">
                <p className="mono-label">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString(locale, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "draft"}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{localized(post.title, locale)}</h2>
                <div className="mt-2 flex-1 [&_p]:text-sm [&_p]:text-muted-foreground">
                  <Markdown value={localized(post.excerpt, locale)} />
                </div>
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-signal"
                >
                  {t("blog.readMore")} <ArrowRight className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-mono text-sm text-muted-foreground">{t("blog.empty")}</p>
        )}
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
