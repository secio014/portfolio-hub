import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { ThemeProvider, themeBootstrapScript } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ThemeLangControls } from "@/components/site/theme-lang-controls";
import { settingsQuery } from "@/lib/queries";

const ACCENT_VARS = ["--signal", "--primary", "--ring", "--sidebar-primary", "--sidebar-ring"];

/** Applies admin-configured accent colors, fonts, tab title and favicon at runtime. */
function SiteCustomization() {
  const { data: settings } = useQuery(settingsQuery);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (!settings) return;

    const STYLE_ID = "site-customization-vars";
    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    const lightRules: string[] = [];
    const darkRules: string[] = [];
    if (settings.theme_accent_light) {
      lightRules.push(...ACCENT_VARS.map((name) => `${name}: ${settings.theme_accent_light};`));
    }
    if (settings.theme_accent_dark) {
      darkRules.push(...ACCENT_VARS.map((name) => `${name}: ${settings.theme_accent_dark};`));
    }
    if (settings.font_sans) {
      lightRules.push(
        `--font-sans: "${settings.font_sans}", ui-sans-serif, system-ui, sans-serif;`,
      );
    }
    if (settings.font_mono) {
      lightRules.push(
        `--font-mono: "${settings.font_mono}", ui-monospace, SFMono-Regular, monospace;`,
      );
    }
    styleEl.textContent = [
      lightRules.length ? `:root { ${lightRules.join(" ")} }` : "",
      darkRules.length ? `[data-theme="dark"] { ${darkRules.join(" ")} }` : "",
    ].join("\n");

    const LINK_ID = "site-customization-fonts";
    const families = [settings.font_sans, settings.font_mono].filter(Boolean) as string[];
    let fontLink = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (families.length) {
      const query = families
        .map((family) => `family=${family.replace(/\s+/g, "+")}:wght@400;500;600;700`)
        .join("&");
      const href = `https://fonts.bunny.net/css2?${query}&display=swap`;
      if (!fontLink) {
        fontLink = document.createElement("link");
        fontLink.id = LINK_ID;
        fontLink.rel = "stylesheet";
        document.head.appendChild(fontLink);
      }
      if (fontLink.href !== href) fontLink.href = href;
    } else {
      fontLink?.remove();
    }

    if (settings.favicon_url) {
      let iconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!iconLink) {
        iconLink = document.createElement("link");
        iconLink.rel = "icon";
        document.head.appendChild(iconLink);
      }
      iconLink.href = settings.favicon_url;
    }

    if (settings.site_title) {
      document.title = settings.site_title;
    }
  }, [settings, pathname]);

  return null;
}

function NotFoundComponent() {
  const { t } = useI18n();
  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center px-4">
      <ThemeLangControls className="absolute right-4 top-4 sm:right-6 sm:top-6" />
      <div className="max-w-md text-center">
        <h1 className="font-mono text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("notFound.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("notFound.description")}</p>
        <div className="mt-6">
          <Button asChild className="h-11 font-mono text-xs">
            <Link to="/">{t("notFound.goHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Pedro Schmitz Sécio" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <SiteCustomization />
          <PageTransition>
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </PageTransition>
          <Toaster />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/** Quick, non-blocking fade/slide on route change — never delays interaction. */
function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
