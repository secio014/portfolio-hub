import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SiteLayout, Section } from "@/components/site/SiteLayout";
import { ShareOnLinkedIn } from "@/components/site/blocks";
import { Markdown } from "@/components/site/Markdown";
import { useI18n, localized } from "@/lib/i18n";
import { blogQuery } from "@/lib/queries";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Pedro Schmitz Sécio` },
      { name: "description", content: "Article from the writing section of the portfolio." },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — Pedro Schmitz Sécio` },
      { property: "og:description", content: "Article from the writing section of the portfolio." },
    ],
  }),
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const { t, locale } = useI18n();
  const { data: posts = [], isLoading } = useQuery(blogQuery);
  const post = posts.find((item) => item.slug === slug);

  if (!isLoading && !post) throw notFound();

  return (
    <SiteLayout page={`blog/${slug}`}>
      <Section className="max-w-3xl">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-signal"
        >
          <ArrowLeft className="size-3.5" /> {t("blog.back")}
        </Link>

        {post ? (
          <article className="mt-6">
            <p className="mono-label">
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString(locale, {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : ""}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
              {localized(post.title, locale)}
            </h1>
            <div className="mt-3 [&_p]:text-sm [&_p]:text-muted-foreground sm:[&_p]:text-base">
              <Markdown value={localized(post.excerpt, locale)} />
            </div>
            <div className="mt-6">
              <Markdown value={localized(post.content, locale)} />
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
