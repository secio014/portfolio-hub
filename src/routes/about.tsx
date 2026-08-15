import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, Section, useSettings } from "@/components/site/SiteLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Certifications, TechStack, Timeline } from "@/components/site/blocks";
import { Markdown } from "@/components/site/Markdown";
import { SectionBlocks } from "@/components/site/SectionBlocks";
import { useI18n, localized } from "@/lib/i18n";
import {
  certificationsQuery,
  sectionBlocksQuery,
  sectionsQuery,
  timelineQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & career — Pedro Schmitz Sécio" },
      {
        name: "description",
        content:
          "Career timeline, certifications and technical stack of Pedro Schmitz Sécio, software engineering student at FIAP.",
      },
      { property: "og:title", content: "About & career — Pedro Schmitz Sécio" },
      {
        property: "og:description",
        content: "Career timeline, certifications and technical stack.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, locale } = useI18n();
  const settings = useSettings();
  const { data: sections = [] } = useQuery(sectionsQuery);
  const { data: timeline = [] } = useQuery(timelineQuery);
  const { data: certifications = [] } = useQuery(certificationsQuery);
  const { data: sectionBlocks = [] } = useQuery(sectionBlocksQuery);
  const blocksFor = (sectionId: string | undefined) =>
    sectionId ? sectionBlocks.filter((block) => block.section_id === sectionId) : [];

  const about = sections.find((section) => section.section_key === "about");
  const isAboutVisible = about ? about.visible !== false : true;
  const stack = Array.isArray(settings?.tech_stack) ? (settings.tech_stack as string[]) : [];
  const visibleTimeline = timeline.filter((item) => item.visible !== false);
  const visibleCertifications = certifications.filter((item) => item.visible !== false);
  const work = visibleTimeline.filter((item) => (item.type ?? "work") === "work");
  const study = visibleTimeline.filter((item) => item.type === "study");

  return (
    <SiteLayout page="about">
      {isAboutVisible ? (
        <Section>
          <SectionHeading
            index="01"
            title={localized(about?.title, locale) || t("nav.about")}
            {...(localized(about?.subtitle, locale)
              ? { subtitle: localized(about?.subtitle, locale) }
              : {})}
          />
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <Markdown value={localized(about?.body, locale)} />
            {settings?.avatar_url ? (
              <img
                src={settings.avatar_url}
                alt={`${settings.owner_name} portrait`}
                loading="lazy"
                className="aspect-square w-full rounded-lg border border-border object-cover"
              />
            ) : null}
          </div>
          {blocksFor(about?.id).length ? (
            <div className="mt-6">
              <SectionBlocks
                blocks={blocksFor(about?.id)}
                layout={String(about?.layout ?? "vertical")}
                locale={locale}
              />
            </div>
          ) : null}
        </Section>
      ) : null}

      {work.length ? (
        <Section className="border-t border-border">
          <SectionHeading index="02" title={t("section.timelineWork")} />
          <Timeline items={work} />
        </Section>
      ) : null}

      {study.length ? (
        <Section className="border-t border-border">
          <SectionHeading index="03" title={t("section.timelineStudy")} />
          <Timeline items={study} />
        </Section>
      ) : null}

      <Section className="border-t border-border">
        <SectionHeading index="04" title={t("section.stack")} />
        <TechStack stack={stack} />
      </Section>

      {visibleCertifications.length ? (
        <Section className="border-t border-border">
          <SectionHeading index="05" title={t("section.certifications")} />
          <Certifications items={visibleCertifications} />
        </Section>
      ) : null}

      {sections
        .filter(
          (section) =>
            section.page_slug === "about" && section.type === "custom" && section.visible,
        )
        .map((section, index) => (
          <Section key={section.id} className="border-t border-border">
            <SectionHeading
              index={String(6 + index).padStart(2, "0")}
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
