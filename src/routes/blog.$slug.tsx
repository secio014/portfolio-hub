import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SiteLayout, Section } from "@/components/site/SiteLayout";
import { ShareOnLinkedIn } from "@/components/site/blocks";
import { Markdown } from "@/components/site/Markdown";
import { useI18n, localized } from "@/lib/i18n";
import { blogQuery, settingsQuery } from "@/lib/queries";

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
  const { data: settings } = useQuery(settingsQuery);
  const post = posts.find((item) => item.slug === slug);

  if (!isLoading && !post) throw notFound();

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const showUpdated = post?.updated_at && post?.created_at && post.updated_at !== post.created_at;

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
            <div className="flex items-center gap-2.5">
              {settings?.avatar_url ? (
                <img
                  src={settings.avatar_url}
                  alt={settings.owner_name ?? ""}
                  loading="lazy"
                  className="size-8 shrink-0 rounded-full border border-border object-cover"
                />
              ) : null}
              <p className="mono-label flex flex-wrap items-center gap-x-2 gap-y-1">
                {settings?.owner_name ? (
                  <span>
                    {t("blog.by")} {settings.owner_name}
                  </span>
                ) : null}
                {settings?.owner_name && post.created_at ? <span aria-hidden>·</span> : null}
                {post.created_at ? <span>{formatDate(post.created_at)}</span> : null}
                {showUpdated ? (
                  <span className="text-muted-foreground">
                    ({t("blog.updated")} {formatDate(post.updated_at)})
                  </span>
                ) : null}
              </p>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
              {localized(post.title, locale)}
            </h1>
            {Array.isArray(post.tags) && post.tags.length ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <li
                    key={String(tag)}
                    className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground"
                  >
                    {String(tag)}
                  </li>
                ))}
              </ul>
            ) : null}
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
