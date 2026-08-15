import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, Moon, Sun, X, Languages } from "lucide-react";
import { useState } from "react";
import { useI18n, LOCALES, LOCALE_LABELS, localized } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { labelsQuery, pagesQuery } from "@/lib/queries";
import { LabelBadge } from "@/components/site/blocks";

const links = [
  { to: "/", key: "nav.home" },
  { to: "/projects", key: "nav.projects" },
  { to: "/about", key: "nav.about" },
  { to: "/blog", key: "nav.blog" },
  { to: "/contact", key: "nav.contact" },
] as const;

export function Header({ pageSlug }: { pageSlug?: string }) {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const { data: pages = [] } = useQuery(pagesQuery);
  const { data: labels = [] } = useQuery(labelsQuery);
  const customPages = pages.filter((page) => !page.is_system && page.nav_visible);
  const headerLabels = labels.filter(
    (label) => label.enabled && label.placement === "header" && label.page_slug === pageSlug,
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-mono text-sm font-bold tracking-tight sm:text-base">
            <span className="text-signal">~/</span>pedro
            <span className="caret ml-0.5 h-3.5 align-middle" aria-hidden />
          </Link>
          {headerLabels.length ? (
            <div className="hidden items-center gap-2 sm:flex">
              {headerLabels.map((label) => (
                <LabelBadge key={label.id} label={localized(label.text, locale)} />
              ))}
            </div>
          ) : null}
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              activeProps={{ className: "text-foreground bg-secondary" }}
              className="rounded-md px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </Link>
          ))}
          {customPages.map((page) => (
            <Link
              key={page.slug}
              to="/p/$slug"
              params={{ slug: page.slug }}
              activeProps={{ className: "text-foreground bg-secondary" }}
              className="rounded-md px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {localized(page.title, locale) || page.slug}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t("lang.switch")}
                className="font-mono text-xs"
              >
                <Languages className="size-4" />
                {LOCALE_LABELS[locale]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LOCALES.map((code) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => setLocale(code)}
                  className="font-mono text-xs"
                >
                  {LOCALE_LABELS[code]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggle} aria-label={t("theme.toggle")}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t("nav.menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: link.to === "/" }}
                activeProps={{ className: "text-signal" }}
                className="rounded-md px-2 py-3 font-mono text-sm text-muted-foreground"
              >
                {t(link.key)}
              </Link>
            ))}
            {customPages.map((page) => (
              <Link
                key={page.slug}
                to="/p/$slug"
                params={{ slug: page.slug }}
                onClick={() => setOpen(false)}
                activeProps={{ className: "text-signal" }}
                className="rounded-md px-2 py-3 font-mono text-sm text-muted-foreground"
              >
                {localized(page.title, locale) || page.slug}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
