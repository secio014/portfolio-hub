import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SiteLayout, Section } from "@/components/site/SiteLayout";
import { ShareOnLinkedIn } from "@/components/site/blocks";
import { Markdown } from "@/components/site/Markdown";
import { useI18n, localized } from "@/lib/i18n";
import { caseStudiesQuery } from "@/lib/queries";

export const Route = createFileRoute("/case-studies/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Case study: ${params.slug.replace(/-/g, " ")} — Pedro Schmitz Sécio` },
      {
        name: "description",
        content: "Problem, approach and outcome behind one of the portfolio projects.",
      },
      { property: "og:title", content: `Case study: ${params.slug.replace(/-/g, " ")}` },
      {
        property: "og:description",
        content: "Problem, approach and outcome behind one of the portfolio projects.",
      },
    ],
  }),
  component: CaseStudyPage,
});

function CaseStudyPage() {
  const { slug } = Route.useParams();
  const { t, locale } = useI18n();
  const { data: cases = [], isLoading } = useQuery(caseStudiesQuery);
  const study = cases.find((item) => item.slug === slug);

  if (!isLoading && !study) throw notFound();

  const blocks = [
    { label: t("case.problem"), value: study?.problem },
    { label: t("case.approach"), value: study?.approach },
    { label: t("case.outcome"), value: study?.outcome },
  ];

  return (
    <SiteLayout page={`case-studies/${slug}`}>
      <Section className="max-w-3xl">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-signal"
        >
          <ArrowLeft className="size-3.5" /> {t("case.back")}
        </Link>

        {study ? (
          <article className="mt-6">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
              {localized(study.title, locale)}
            </h1>
            <div className="mt-3">
              <Markdown value={localized(study.content, locale)} />
            </div>

            <div className="mt-8 space-y-7">
              {blocks.map((block) => {
                const text = localized(block.value, locale);
                if (!text) return null;
                return (
                  <section key={block.label}>
                    <h2 className="mono-label text-signal">{block.label}</h2>
                    <div className="mt-2">
                      <Markdown value={text} />
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="mt-8 border-t border-border pt-5">
              <ShareOnLinkedIn />
            </div>
          </article>
        ) : null}
      </Section>
    </SiteLayout>
  );
}
