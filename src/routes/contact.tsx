import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { SiteLayout, Section, useSettings } from "@/components/site/SiteLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ContactForm } from "@/components/site/ContactForm";
import { Markdown } from "@/components/site/Markdown";
import { SectionBlocks } from "@/components/site/SectionBlocks";
import { useI18n, localized } from "@/lib/i18n";
import { sectionBlocksQuery, sectionsQuery } from "@/lib/queries";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Pedro Schmitz Sécio" },
      {
        name: "description",
        content:
          "Get in touch with Pedro Schmitz Sécio about roles, freelance work or collaboration on software projects.",
      },
      { property: "og:title", content: "Contact — Pedro Schmitz Sécio" },
      { property: "og:description", content: "Send a message about work or collaboration." },
    ],
  }),
  component: ContactPage,
});

function ContactLink({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel="noreferrer noopener"
      className="group flex items-center gap-3 rounded-lg border border-transparent p-2.5 transition-colors hover:border-signal/30 hover:bg-signal/5"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-signal/10 text-signal">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="mono-label block">{label}</span>
        <span className="block truncate font-mono text-sm text-foreground">{value}</span>
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

function ContactPage() {
  const { t, locale } = useI18n();
  const settings = useSettings();
  const { data: sections = [] } = useQuery(sectionsQuery);
  const { data: sectionBlocks = [] } = useQuery(sectionBlocksQuery);
  const blocksFor = (sectionId: string | undefined) =>
    sectionId ? sectionBlocks.filter((block) => block.section_id === sectionId) : [];
  const contact = sections.find((section) => section.section_key === "contact");
  const isContactIntroVisible = contact ? contact.visible !== false : true;
  const customSections = sections.filter(
    (section) => section.page_slug === "contact" && section.type === "custom" && section.visible,
  );

  return (
    <SiteLayout page="contact">
      {isContactIntroVisible ? (
        <div className="relative">
          <div className="grid-canvas pointer-events-none absolute inset-0 -z-10" aria-hidden />
          <Section className="!pb-8">
            <SectionHeading
              index="01"
              title={localized(contact?.title, locale) || t("nav.contact")}
              {...(localized(contact?.subtitle, locale)
                ? { subtitle: localized(contact?.subtitle, locale) }
                : {})}
            />
            {localized(contact?.body, locale) ? (
              <div className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                <Markdown value={localized(contact?.body, locale)} />
              </div>
            ) : null}
            {blocksFor(contact?.id).length ? (
              <div className="mt-6">
                <SectionBlocks
                  blocks={blocksFor(contact?.id)}
                  layout={String(contact?.layout ?? "vertical")}
                  locale={locale}
                />
              </div>
            ) : null}
          </Section>
        </div>
      ) : null}

      <Section className="!pt-0">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <ContactForm />
          <div className="panel panel-glow space-y-1 p-3 sm:p-4">
            <p className="mono-label px-2.5 pb-1 pt-1.5">{t("contact.direct")}</p>
            {settings?.email ? (
              <ContactLink
                href={`mailto:${settings.email}`}
                icon={<Mail className="size-4" />}
                label="E-mail"
                value={settings.email}
              />
            ) : null}
            {settings?.github_username ? (
              <ContactLink
                href={`https://github.com/${settings.github_username}`}
                icon={<Github className="size-4" />}
                label="GitHub"
                value={`@${settings.github_username}`}
              />
            ) : null}
            {settings?.linkedin_url ? (
              <ContactLink
                href={settings.linkedin_url}
                icon={<Linkedin className="size-4" />}
                label="LinkedIn"
                value={
                  settings.linkedin_url
                    .replace(/^https?:\/\/(www\.)?linkedin\.com\//, "")
                    .replace(/\/$/, "") || "LinkedIn"
                }
              />
            ) : null}
          </div>
        </div>
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
