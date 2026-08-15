import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { LabelBadge } from "@/components/site/blocks";
import { useI18n, localized } from "@/lib/i18n";
import { labelsQuery, settingsQuery, trackEvent } from "@/lib/queries";

export function useSettings() {
  const { data } = useQuery(settingsQuery);
  return data ?? null;
}

export function SiteLayout({
  children,
  page,
  pageSlug,
}: {
  children: ReactNode;
  page: string;
  pageSlug?: string;
}) {
  const settings = useSettings();
  const { locale } = useI18n();
  const { data: labels = [] } = useQuery(labelsQuery);
  const resolvedPageSlug = pageSlug ?? page;

  useEffect(() => {
    trackEvent("page_view", page);
  }, [page]);

  const githubUrl = settings?.github_username
    ? `https://github.com/${settings.github_username}`
    : "https://github.com";

  const topLabels = labels.filter(
    (label) => label.enabled && label.placement === "top" && label.page_slug === resolvedPageSlug,
  );

  return (
    <div className="grid-bg flex min-h-screen flex-col">
      <Header pageSlug={resolvedPageSlug} />
      <main className="flex-1">
        {topLabels.length ? (
          <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pt-6 sm:px-6">
            {topLabels.map((label) => (
              <LabelBadge key={label.id} label={localized(label.text, locale)} />
            ))}
          </div>
        ) : null}
        {children}
      </main>
      <Footer
        email={settings?.email ?? ""}
        githubUrl={githubUrl}
        linkedinUrl={settings?.linkedin_url ?? "https://www.linkedin.com"}
        ownerName={settings?.owner_name ?? "Portfolio"}
      />
    </div>
  );
}

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 ${className}`}>
      {children}
    </section>
  );
}
