import { Link } from "@tanstack/react-router";
import { ChevronDown, ExternalLink, Github, Star, Building2 } from "lucide-react";
import { useMemo, useState } from "react";
import { labelColorClass, labelColorStyle, type DisplayProject } from "@/lib/projects";
import { useI18n } from "@/lib/i18n";
import { trackEvent } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/site/Markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function ProjectActions({ project }: { project: DisplayProject }) {
  const { t } = useI18n();
  return (
    <>
      {project.repoUrl ? (
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 font-mono text-xs">
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(event) => {
              event.stopPropagation();
              trackEvent("project_click", project.key);
            }}
          >
            <Github className="size-3.5" /> {t("projects.repo")}
          </a>
        </Button>
      ) : null}
      {project.demoUrl ? (
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 font-mono text-xs">
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(event) => {
              event.stopPropagation();
              trackEvent("demo_click", project.key);
            }}
          >
            <ExternalLink className="size-3.5" /> {t("projects.demo")}
          </a>
        </Button>
      ) : null}
      {project.caseStudySlug ? (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 px-2 font-mono text-xs text-signal"
        >
          <Link
            to="/case-studies/$slug"
            params={{ slug: project.caseStudySlug }}
            onClick={(event) => event.stopPropagation()}
          >
            {t("projects.caseStudy")}
          </Link>
        </Button>
      ) : null}
    </>
  );
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: DisplayProject;
  onOpen: (project: DisplayProject) => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(project);
        }
      }}
      className="panel group flex cursor-pointer flex-col p-4 text-left transition-colors hover:border-signal/60 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-mono text-sm font-semibold break-words sm:text-base">
          {project.title}
        </h3>
        {project.label ? (
          <Badge
            variant="outline"
            className={`shrink-0 font-mono text-[10px] ${labelColorClass(project.label.color)}`}
            style={labelColorStyle(project.label.color)}
          >
            {project.label.name}
          </Badge>
        ) : null}
      </div>

      <div className="mt-2 line-clamp-3 flex-1 [&_p]:text-sm [&_p]:text-muted-foreground">
        <Markdown value={project.description} />
      </div>

      {project.tech.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {project.tech.slice(0, 6).map((tech) => (
            <li
              key={tech}
              className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {tech}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <ProjectActions project={project} />
        <span className="ml-auto flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          {project.isOrg ? <Building2 className="size-3.5" aria-label="organization" /> : null}
          {project.stars > 0 ? (
            <span className="flex items-center gap-1">
              <Star className="size-3.5" /> {project.stars}
            </span>
          ) : null}
        </span>
      </div>
    </article>
  );
}

function ProjectModal({
  project,
  onOpenChange,
}: {
  project: DisplayProject | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();

  return (
    <Dialog open={project !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {project ? (
          <>
            <DialogHeader className="pr-8">
              <div className="flex items-start justify-between gap-3">
                <DialogTitle className="font-mono text-base">{project.title}</DialogTitle>
                {project.label ? (
                  <Badge
                    variant="outline"
                    className={`shrink-0 font-mono text-[10px] ${labelColorClass(project.label.color)}`}
                    style={labelColorStyle(project.label.color)}
                  >
                    {project.label.name}
                  </Badge>
                ) : null}
              </div>
              <DialogDescription className="sr-only">{project.title}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {project.summary ? (
                <div className="rounded-md border border-signal/30 bg-signal/5 p-3">
                  <p className="mono-label mb-1 text-signal">{t("projects.summary")}</p>
                  <p className="text-sm text-foreground">{project.summary}</p>
                </div>
              ) : null}

              {project.description ? (
                <div className="[&_p]:text-sm [&_p]:text-muted-foreground">
                  <Markdown value={project.description} />
                </div>
              ) : null}

              {project.tech.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {project.tech.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <ProjectActions project={project} />
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function ProjectGrid({
  projects,
  withFilters = false,
}: {
  projects: DisplayProject[];
  withFilters?: boolean;
}) {
  const { t } = useI18n();
  const [labelId, setLabelId] = useState<string>("all");
  const [tech, setTech] = useState<string>("all");
  const [selected, setSelected] = useState<DisplayProject | null>(null);

  const labelOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>();
    projects.forEach((project) => {
      if (project.label) map.set(project.label.id, project.label);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  const techOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((project) => project.tech.forEach((item) => set.add(item)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const filtered = useMemo(
    () =>
      projects.filter(
        (project) =>
          (labelId === "all" || project.label?.id === labelId) &&
          (tech === "all" || project.tech.includes(tech)),
      ),
    [projects, labelId, tech],
  );

  return (
    <div>
      {withFilters ? (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={labelId === "all" ? "default" : "outline"}
              className="h-8 font-mono text-xs"
              onClick={() => setLabelId("all")}
            >
              {t("projects.filterAll")}
            </Button>
            {labelOptions.map((label) => (
              <Button
                key={label.id}
                size="sm"
                variant={labelId === label.id ? "default" : "outline"}
                className="h-8 font-mono text-xs"
                onClick={() => setLabelId(label.id)}
              >
                {label.name}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <select
              value={tech}
              onChange={(event) => setTech(event.target.value)}
              aria-label={t("projects.filterTech")}
              className="h-9 w-full appearance-none rounded-md border border-input bg-background px-2 pr-8 font-mono text-xs"
            >
              <option value="all">
                {t("projects.filterTech")}: {t("projects.filterAll")}
              </option>
              {techOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        </div>
      ) : null}

      {filtered.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.key} project={project} onOpen={setSelected} />
          ))}
        </div>
      ) : (
        <p className="panel p-6 text-center font-mono text-sm text-muted-foreground">
          {t("projects.empty")}
        </p>
      )}

      <ProjectModal
        project={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
