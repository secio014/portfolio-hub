import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, Mail } from "lucide-react";
import { useMemo } from "react";
import { SiteLayout, Section, useSettings } from "@/components/site/SiteLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ProjectGrid } from "@/components/site/ProjectGrid";
import { Terminal } from "@/components/site/Terminal";
import { ContributionGraph } from "@/components/site/ContributionGraph";
import { LabelBadge, Metrics, TechStack, Testimonials } from "@/components/site/blocks";
import { Markdown } from "@/components/site/Markdown";
import { SectionBlocks } from "@/components/site/SectionBlocks";
import { Button } from "@/components/ui/button";
import { useI18n, localized } from "@/lib/i18n";
import { buildProjects } from "@/lib/projects";
import { differenceInYears } from "date-fns";
import {
  activityQuery,
  blogQuery,
  caseStudiesQuery,
  labelsQuery,
  projectLabelsQuery,
  projectsQuery,
  reposQuery,
  resumeQuery,
  sectionBlocksQuery,
  sectionsQuery,
  testimonialsQuery,
  timelineQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pedro Schmitz Sécio | Portfolio" },
      {
        name: "description",
        content:
          "Portfolio of Pedro Schmitz Sécio — software engineering student at FIAP and technology intern at Tokio Marine Brasil.",
      },
      { property: "og:title", content: "Pedro Schmitz Sécio | Portfolio" },
      {
        property: "og:description",
        content: "Projects synced from GitHub, case studies, career timeline and writing.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { t, locale } = useI18n();
  const settings = useSettings();
  const sectionsResult = useQuery(sectionsQuery);
  const sections = sectionsResult.data ?? [];
  const { data: repos = [] } = useQuery(reposQuery);
  const { data: manual = [] } = useQuery(projectsQuery);
  const { data: cases = [] } = useQuery(caseStudiesQuery);
  const { data: testimonials = [] } = useQuery(testimonialsQuery);
  const { data: activity } = useQuery(activityQuery);
  const { data: resume } = useQuery(resumeQuery);
  const { data: posts = [] } = useQuery(blogQuery);
  const { data: timeline = [] } = useQuery(timelineQuery);
  const { data: labels = [] } = useQuery(labelsQuery);
  const { data: projectLabels = [] } = useQuery(projectLabelsQuery);
  const { data: sectionBlocks = [] } = useQuery(sectionBlocksQuery);
  const blocksFor = (sectionId: string | undefined) =>
    sectionId ? sectionBlocks.filter((block) => block.section_id === sectionId) : [];
  const heroLabels = labels.filter(
    (label) => label.enabled && label.placement === "hero" && label.page_slug === "home",
  );

  const yearsCoding = useMemo(() => {
    const workStarts = timeline
      .filter((item) => (item.type ?? "work") === "work")
      .map((item) => new Date(item.start_date))
      .filter((date) => !Number.isNaN(date.getTime()));
    if (!workStarts.length) return undefined;
    const earliest = new Date(Math.min(...workStarts.map((date) => date.getTime())));
    return Math.max(1, differenceInYears(new Date(), earliest));
  }, [timeline]);

  const hero = sections.find((section) => section.section_key === "hero");
  const customSections = sections.filter(
    (section) => section.page_slug === "home" && section.type === "custom" && section.visible,
  );

  // "block" sections are fixed home blocks (activity, stack, etc.) — admins can
  // hide them but not delete them. Checking `.visible` explicitly (not just
  // presence) matters because an authenticated admin's RLS policy returns
  // hidden rows too, unlike anonymous visitors.
  const isSectionVisible = (key: string) =>
    sectionsResult.isPending ||
    sections.some((section) => section.section_key === key && section.visible);
  const projects = useMemo(
    () => buildProjects(repos, manual, cases, locale, projectLabels),
    [repos, manual, cases, locale, projectLabels],
  );
  const featured = projects.filter((project) => project.featured).slice(0, 6);
  const shown = featured.length ? featured : projects.slice(0, 6);
  const stack = Array.isArray(settings?.tech_stack) ? (settings.tech_stack as string[]) : [];
  const days = Array.isArray(activity?.days)
    ? (activity.days as { date: string; count: number }[])
    : [];
  const orgDays = Array.isArray(activity?.org_days)
    ? (activity.org_days as { date: string; count: number }[])
    : [];

  const visibleBlocks = [
    isSectionVisible("activity") && "activity",
    isSectionVisible("stack") && "stack",
    isSectionVisible("featured") && "featured",
    isSectionVisible("testimonials") && testimonials.length && "testimonials",
    isSectionVisible("blog") && posts.length && "blog",
  ].filter((key): key is string => Boolean(key));
  const blockIndex = (key: string) => String(visibleBlocks.indexOf(key) + 1).padStart(2, "0");

  return (
    <SiteLayout page="home">
      {isSectionVisible("hero") ? (
        <div className="relative">
          <div className="grid-canvas pointer-events-none absolute inset-0 -z-10" aria-hidden />
          <Section className="!pt-12 sm:!pt-20">
            <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                {heroLabels.length ? (
                  <div className="flex flex-wrap gap-2">
                    {heroLabels.map((label) => (
                      <LabelBadge key={label.id} label={localized(label.text, locale)} />
                    ))}
                  </div>
                ) : null}
                <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  {localized(hero?.title, locale)}
                </h1>
                <p className="mt-4 font-mono text-xs text-signal sm:text-sm">
                  {localized(hero?.subtitle, locale)}
                </p>
                <div className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
                  <Markdown value={localized(hero?.body, locale)} />
                </div>

                {blocksFor(hero?.id).length ? (
                  <div className="mt-6 max-w-xl">
                    <SectionBlocks
                      blocks={blocksFor(hero?.id)}
                      layout={String(hero?.layout ?? "vertical")}
                      locale={locale}
                    />
                  </div>
                ) : null}

                <div className="mt-7 flex flex-wrap gap-2.5">
                  <Button asChild className="h-11 font-mono text-xs">
                    <Link to="/projects">
                      {t("hero.viewWork")} <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  {resume?.file_url ? (
                    <Button asChild variant="outline" className="h-11 font-mono text-xs">
                      <a href={resume.file_url} target="_blank" rel="noreferrer noopener">
                        <Download className="size-4" /> {t("hero.resume")}
                      </a>
                    </Button>
                  ) : null}
                  <Button asChild variant="ghost" className="h-11 font-mono text-xs">
                    <Link to="/contact">
                      <Mail className="size-4" /> {t("hero.contact")}
                    </Link>
                  </Button>
                </div>

                <div className="mt-9">
                  <Metrics metrics={(settings?.metrics as Record<string, unknown>) ?? {}} />
                </div>
              </div>

              <div className="space-y-4">
                {settings?.avatar_url ? (
                  <img
                    src={settings.avatar_url}
                    alt={`${settings.owner_name} portrait`}
                    loading="lazy"
                    className="aspect-square w-full rounded-lg border border-border object-cover"
                  />
                ) : null}
                <Terminal
                  email={settings?.email ?? ""}
                  github={
                    settings?.github_username ? `github.com/${settings.github_username}` : "-"
                  }
                  linkedin={settings?.linkedin_url ?? "-"}
                  skills={stack}
                  ownerName={settings?.owner_name}
                  yearsCoding={yearsCoding}
                />
              </div>
            </div>
          </Section>
        </div>
      ) : null}

      {isSectionVisible("activity") ? (
        <Section id="activity">
          <SectionHeading index={blockIndex("activity")} title={t("section.activity")} />
          <ContributionGraph
            personalDays={days}
            personalTotal={activity?.total_contributions ?? 0}
            personalLabel={
              settings?.github_username
                ? `${t("activity.personal")} · @${settings.github_username}`
                : t("activity.personal")
            }
            orgDays={orgDays}
            orgTotal={activity?.org_total_contributions ?? 0}
            orgLabel={
              settings?.github_org ? `${t("activity.org")} · @${settings.github_org}` : undefined
            }
          />
        </Section>
      ) : null}

      {isSectionVisible("stack") ? (
        <Section id="stack" className="border-t border-border">
          <SectionHeading index={blockIndex("stack")} title={t("section.stack")} />
          <TechStack stack={stack} />
        </Section>
      ) : null}

      {isSectionVisible("featured") ? (
        <Section id="featured" className="border-t border-border">
          <SectionHeading
            index={blockIndex("featured")}
            title={t("section.featured")}
            subtitle={t("section.featuredSub")}
          />
          <ProjectGrid projects={shown} />
          <div className="mt-6">
            <Button asChild variant="outline" className="h-10 font-mono text-xs">
              <Link to="/projects">
                {t("section.allProjects")} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Section>
      ) : null}

      {isSectionVisible("testimonials") && testimonials.length ? (
        <Section id="testimonials" className="border-t border-border">
          <SectionHeading index={blockIndex("testimonials")} title={t("section.testimonials")} />
          <Testimonials items={testimonials} />
        </Section>
      ) : null}

      {isSectionVisible("blog") && posts.length ? (
        <Section id="writing" className="border-t border-border">
          <SectionHeading index={blockIndex("blog")} title={t("section.blog")} />
          <ul className="grid gap-3 sm:grid-cols-2">
            {posts.slice(0, 4).map((post) => (
              <li key={post.id} className="panel p-4">
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="font-mono text-sm font-semibold hover:text-signal"
                >
                  {localized(post.title, locale)}
                </Link>
                <div className="mt-1.5 line-clamp-2 [&_p]:text-sm [&_p]:text-muted-foreground">
                  <Markdown value={localized(post.excerpt, locale)} />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {customSections.map((section, index) => (
        <Section key={section.id} className="border-t border-border">
          <SectionHeading
            index={String(visibleBlocks.length + index + 1).padStart(2, "0")}
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
