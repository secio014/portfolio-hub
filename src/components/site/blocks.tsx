import { useEffect, useState } from "react";
import { Award, ExternalLink, Linkedin, Share2 } from "lucide-react";
import { useI18n, localized } from "@/lib/i18n";
import { getTechIcon } from "@/lib/tech-stack";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/site/Markdown";

export function LabelBadge({ label }: { label: string }) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-signal/40 bg-accent px-3 py-1 font-mono text-[11px] text-accent-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-2 animate-ping rounded-full bg-signal opacity-70" />
        <span className="relative inline-flex size-2 rounded-full bg-signal" />
      </span>
      {label}
    </span>
  );
}

export function Metrics({ metrics }: { metrics: Record<string, unknown> }) {
  const { t } = useI18n();
  const items = [
    { key: "projects", label: t("metrics.projects") },
    { key: "technologies", label: t("metrics.technologies") },
    { key: "years", label: t("metrics.years") },
  ];
  return (
    <dl className="grid grid-cols-3 gap-3 sm:gap-4">
      {items.map((item) => (
        <div key={item.key} className="panel p-3 sm:p-4">
          <dt className="mono-label">{item.label}</dt>
          <dd className="mt-1 font-mono text-2xl font-bold text-signal sm:text-3xl">
            {String(metrics?.[item.key] ?? 0)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function TechStack({ stack }: { stack: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {stack.map((tech) => {
        const Icon = getTechIcon(tech);
        return (
          <li
            key={tech}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 font-mono text-xs text-surface-foreground transition-colors hover:border-signal/60"
          >
            <Icon className="size-3.5" />
            {tech}
          </li>
        );
      })}
    </ul>
  );
}

type TimelineRow = {
  id: string;
  title: unknown;
  institution: string;
  start_date: string;
  end_date: string | null;
  description: unknown;
  type?: string;
};

export function Timeline({ items }: { items: TimelineRow[] }) {
  const { locale, t } = useI18n();
  const format = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(locale, { month: "short", year: "numeric" })
      : t("present");

  return (
    <ol className="relative space-y-6 border-l border-border pl-5 sm:pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[27px] top-1.5 size-2.5 rounded-full bg-signal sm:-left-[31px]" />
          <p className="mono-label">
            {format(item.start_date)} → {format(item.end_date)}
          </p>
          <h3 className="mt-1 text-base font-semibold sm:text-lg">
            {localized(item.title, locale)}
          </h3>
          <p className="font-mono text-xs text-signal">{item.institution}</p>
          <div className="mt-1.5 [&>div]:space-y-0 [&_p]:text-sm [&_p]:text-muted-foreground">
            <Markdown value={localized(item.description, locale)} />
          </div>
        </li>
      ))}
    </ol>
  );
}

type CertRow = {
  id: string;
  name: string;
  issuer: string;
  date: string | null;
  credential_url: string | null;
};

export function Certifications({ items }: { items: CertRow[] }) {
  const { locale } = useI18n();
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="panel flex items-start gap-3 p-4">
          <Award className="mt-0.5 size-4 shrink-0 text-signal" />
          <div className="min-w-0">
            <p className="text-sm font-semibold break-words">{item.name}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {item.issuer}
              {item.date
                ? ` · ${new Date(item.date).toLocaleDateString(locale, { year: "numeric", month: "short" })}`
                : ""}
            </p>
            {item.credential_url ? (
              <a
                href={item.credential_url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-signal"
              >
                credential <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

type TestimonialRow = { id: string; author_name: string; author_role: unknown; quote: unknown };

export function Testimonials({ items }: { items: TestimonialRow[] }) {
  const { locale } = useI18n();
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="panel flex flex-col p-4 sm:p-5">
          <div className="flex-1 text-sm leading-relaxed [&_p]:inline [&_p]:before:content-['“'] [&_p]:after:content-['”']">
            <Markdown value={localized(item.quote, locale)} />
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <p className="font-mono text-xs font-semibold">{item.author_name}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {localized(item.author_role, locale)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Official LinkedIn share URL scheme — no scraping, no unofficial APIs. */
export function ShareOnLinkedIn({ url }: { url?: string }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState("");
  useEffect(() => {
    setCurrent(window.location.href);
  }, []);
  const target = url ?? current;
  return (
    <Button asChild variant="outline" size="sm" className="h-9 font-mono text-xs">
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(target)}`}
        target="_blank"
        rel="noreferrer noopener"
      >
        <Linkedin className="size-3.5" />
        {t("share.linkedin")}
        <Share2 className="size-3.5" />
      </a>
    </Button>
  );
}
