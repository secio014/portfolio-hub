import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export const LOCALES = ["en", "pt", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
  es: "ES",
};

/** UI chrome strings. All *content* lives in the database, per language. */
const dict = {
  en: {
    "nav.home": "Home",
    "nav.projects": "Projects",
    "nav.about": "About",
    "nav.blog": "Blog",
    "nav.contact": "Contact",
    "nav.menu": "Menu",
    "hero.viewWork": "View projects",
    "hero.resume": "Download resume",
    "hero.contact": "Get in touch",
    "metrics.projects": "Projects shipped",
    "metrics.technologies": "Technologies",
    "metrics.years": "Years coding",
    "section.featured": "Featured projects",
    "section.featuredSub": "Selected work, synced from GitHub.",
    "section.allProjects": "All projects",
    "section.timeline": "Career timeline",
    "section.timelineWork": "Professional experience",
    "section.timelineStudy": "Education",
    "section.certifications": "Certifications & courses",
    "section.stack": "Tech stack",
    "section.caseStudies": "Case studies",
    "section.testimonials": "Testimonials",
    "section.blog": "Writing",
    "section.activity": "GitHub activity",
    "section.terminal": "Try the terminal",
    "projects.filterAll": "All",
    "projects.filterTech": "Technology",
    "projects.repo": "Repository",
    "projects.demo": "Live demo",
    "projects.empty": "No projects match these filters yet.",
    "projects.caseStudy": "Read case study",
    "projects.summary": "Quick summary",
    "projects.summaryPending": "Summary being generated — check back soon.",
    "blog.readMore": "Read article",
    "blog.empty": "No articles published yet.",
    "blog.back": "Back to blog",
    "blog.by": "By",
    "blog.updated": "Updated",
    "case.problem": "Problem",
    "case.approach": "Approach",
    "case.outcome": "Outcome",
    "case.back": "Back to projects",
    "contact.name": "Name",
    "contact.email": "Email",
    "contact.message": "Message",
    "contact.send": "Send message",
    "contact.sending": "Sending…",
    "contact.success": "Message sent. I'll reply soon.",
    "contact.error": "Could not send the message. Try again.",
    "contact.direct": "Or reach me directly",
    "share.linkedin": "Share on LinkedIn",
    "theme.toggle": "Toggle theme",
    "lang.switch": "Change language",
    "activity.contributions": "contributions in the last year",
    "activity.personal": "Personal",
    "activity.org": "Organization",
    "footer.built": "Built with TypeScript, React and a lot of coffee.",
    present: "Present",
    "terminal.bannerHint": "portfolio-shell v1.0.0 — type `help` to list commands",
    "terminal.helpWhoami": "who is behind this site",
    "terminal.helpSkills": "current tech stack",
    "terminal.helpContact": "email address",
    "terminal.helpSocials": "github + linkedin",
    "terminal.helpUptime": "time spent writing code",
    "terminal.helpCoffee": "???",
    "terminal.helpClear": "clear the screen",
    "terminal.whoami1": "{name} — software engineering student @ FIAP,",
    "terminal.whoami2": "technology intern @ Tokio Marine Brasil.",
    "terminal.whoami3": "builds web platforms, breaks them, then fixes them properly.",
    "terminal.noSkills": "no skills registered yet",
    "terminal.emailMissing": "email not configured",
    "terminal.uptime": "up {years} years, 0 users lost, ∞ console.logs written",
    "terminal.coffee": "Error 418: I'm a teapot ☕",
    "terminal.ls": "about/  projects/  blog/  case-studies/  contact/",
    "terminal.notFound": "command not found: {command}",
    "terminal.notFoundHint": "type `help` for the list of commands",
    "terminal.inputLabel": "terminal input",
  },
  pt: {
    "nav.home": "Início",
    "nav.projects": "Projetos",
    "nav.about": "Sobre",
    "nav.blog": "Blog",
    "nav.contact": "Contato",
    "nav.menu": "Menu",
    "hero.viewWork": "Ver projetos",
    "hero.resume": "Baixar currículo",
    "hero.contact": "Entrar em contato",
    "metrics.projects": "Projetos entregues",
    "metrics.technologies": "Tecnologias",
    "metrics.years": "Anos programando",
    "section.featured": "Projetos em destaque",
    "section.featuredSub": "Trabalhos selecionados, sincronizados do GitHub.",
    "section.allProjects": "Todos os projetos",
    "section.timeline": "Trajetória",
    "section.timelineWork": "Experiência profissional",
    "section.timelineStudy": "Formação acadêmica",
    "section.certifications": "Certificações e cursos",
    "section.stack": "Stack técnica",
    "section.caseStudies": "Estudos de caso",
    "section.testimonials": "Depoimentos",
    "section.blog": "Artigos",
    "section.activity": "Atividade no GitHub",
    "section.terminal": "Experimente o terminal",
    "projects.filterAll": "Todos",
    "projects.filterTech": "Tecnologia",
    "projects.repo": "Repositório",
    "projects.demo": "Demo",
    "projects.empty": "Nenhum projeto corresponde a estes filtros.",
    "projects.caseStudy": "Ver estudo de caso",
    "projects.summary": "Resumo rápido",
    "projects.summaryPending": "Resumo em geração — volte em instantes.",
    "blog.readMore": "Ler artigo",
    "blog.empty": "Nenhum artigo publicado ainda.",
    "blog.back": "Voltar ao blog",
    "blog.by": "Por",
    "blog.updated": "Atualizado em",
    "case.problem": "Problema",
    "case.approach": "Abordagem",
    "case.outcome": "Resultado",
    "case.back": "Voltar aos projetos",
    "contact.name": "Nome",
    "contact.email": "E-mail",
    "contact.message": "Mensagem",
    "contact.send": "Enviar mensagem",
    "contact.sending": "Enviando…",
    "contact.success": "Mensagem enviada. Responderei em breve.",
    "contact.error": "Não foi possível enviar. Tente novamente.",
    "contact.direct": "Ou fale comigo direto",
    "share.linkedin": "Compartilhar no LinkedIn",
    "theme.toggle": "Alternar tema",
    "lang.switch": "Mudar idioma",
    "activity.contributions": "contribuições no último ano",
    "activity.personal": "Pessoal",
    "activity.org": "Organização",
    "footer.built": "Feito com TypeScript, React e muito café.",
    present: "Atual",
    "terminal.bannerHint": "portfolio-shell v1.0.0 — digite `help` para ver os comandos",
    "terminal.helpWhoami": "quem está por trás deste site",
    "terminal.helpSkills": "stack técnica atual",
    "terminal.helpContact": "endereço de e-mail",
    "terminal.helpSocials": "github + linkedin",
    "terminal.helpUptime": "tempo gasto programando",
    "terminal.helpCoffee": "???",
    "terminal.helpClear": "limpar a tela",
    "terminal.whoami1": "{name} — estudante de engenharia de software na FIAP,",
    "terminal.whoami2": "estagiário de tecnologia na Tokio Marine Brasil.",
    "terminal.whoami3": "constrói plataformas web, quebra elas, depois conserta direito.",
    "terminal.noSkills": "nenhuma habilidade registrada ainda",
    "terminal.emailMissing": "e-mail não configurado",
    "terminal.uptime": "ativo há {years} anos, 0 usuários perdidos, ∞ console.logs escritos",
    "terminal.coffee": "Erro 418: sou um bule de chá ☕",
    "terminal.ls": "about/  projects/  blog/  case-studies/  contact/",
    "terminal.notFound": "comando não encontrado: {command}",
    "terminal.notFoundHint": "digite `help` para ver a lista de comandos",
    "terminal.inputLabel": "entrada do terminal",
  },
  es: {
    "nav.home": "Inicio",
    "nav.projects": "Proyectos",
    "nav.about": "Sobre mí",
    "nav.blog": "Blog",
    "nav.contact": "Contacto",
    "nav.menu": "Menú",
    "hero.viewWork": "Ver proyectos",
    "hero.resume": "Descargar CV",
    "hero.contact": "Contactar",
    "metrics.projects": "Proyectos entregados",
    "metrics.technologies": "Tecnologías",
    "metrics.years": "Años programando",
    "section.featured": "Proyectos destacados",
    "section.featuredSub": "Trabajos seleccionados, sincronizados desde GitHub.",
    "section.allProjects": "Todos los proyectos",
    "section.timeline": "Trayectoria",
    "section.timelineWork": "Experiencia profesional",
    "section.timelineStudy": "Formación académica",
    "section.certifications": "Certificaciones y cursos",
    "section.stack": "Stack técnico",
    "section.caseStudies": "Casos de estudio",
    "section.testimonials": "Testimonios",
    "section.blog": "Artículos",
    "section.activity": "Actividad en GitHub",
    "section.terminal": "Prueba la terminal",
    "projects.filterAll": "Todos",
    "projects.filterTech": "Tecnología",
    "projects.repo": "Repositorio",
    "projects.demo": "Demo",
    "projects.empty": "Ningún proyecto coincide con estos filtros.",
    "projects.caseStudy": "Ver caso de estudio",
    "projects.summary": "Resumen rápido",
    "projects.summaryPending": "Resumen en generación — vuelve pronto.",
    "blog.readMore": "Leer artículo",
    "blog.empty": "Aún no hay artículos publicados.",
    "blog.back": "Volver al blog",
    "blog.by": "Por",
    "blog.updated": "Actualizado el",
    "case.problem": "Problema",
    "case.approach": "Enfoque",
    "case.outcome": "Resultado",
    "case.back": "Volver a proyectos",
    "contact.name": "Nombre",
    "contact.email": "Correo",
    "contact.message": "Mensaje",
    "contact.send": "Enviar mensaje",
    "contact.sending": "Enviando…",
    "contact.success": "Mensaje enviado. Responderé pronto.",
    "contact.error": "No se pudo enviar. Inténtalo de nuevo.",
    "contact.direct": "O contáctame directamente",
    "share.linkedin": "Compartir en LinkedIn",
    "theme.toggle": "Cambiar tema",
    "lang.switch": "Cambiar idioma",
    "activity.contributions": "contribuciones en el último año",
    "activity.personal": "Personal",
    "activity.org": "Organización",
    "footer.built": "Hecho con TypeScript, React y mucho café.",
    present: "Actual",
    "terminal.bannerHint": "portfolio-shell v1.0.0 — escribe `help` para ver los comandos",
    "terminal.helpWhoami": "quién está detrás de este sitio",
    "terminal.helpSkills": "stack técnico actual",
    "terminal.helpContact": "dirección de correo",
    "terminal.helpSocials": "github + linkedin",
    "terminal.helpUptime": "tiempo dedicado a programar",
    "terminal.helpCoffee": "???",
    "terminal.helpClear": "limpiar la pantalla",
    "terminal.whoami1": "{name} — estudiante de ingeniería de software en FIAP,",
    "terminal.whoami2": "pasante de tecnología en Tokio Marine Brasil.",
    "terminal.whoami3": "construye plataformas web, las rompe y luego las arregla bien.",
    "terminal.noSkills": "aún no hay habilidades registradas",
    "terminal.emailMissing": "correo no configurado",
    "terminal.uptime": "activo hace {years} años, 0 usuarios perdidos, ∞ console.logs escritos",
    "terminal.coffee": "Error 418: soy una tetera ☕",
    "terminal.ls": "about/  projects/  blog/  case-studies/  contact/",
    "terminal.notFound": "comando no encontrado: {command}",
    "terminal.notFoundHint": "escribe `help` para ver la lista de comandos",
    "terminal.inputLabel": "entrada de la terminal",
  },
} satisfies Record<Locale, Record<string, string>>;

export type TranslationKey = keyof (typeof dict)["en"];

const STORAGE_KEY = "portfolio.locale";

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

const I18nContext = createContext<I18nValue>({
  locale: "en",
  setLocale: () => {},
  t: (key, vars) => interpolate(dict.en[key], vars),
});

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (LOCALES as readonly string[]).includes(stored)) return stored as Locale;
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const candidate of candidates) {
    const base = candidate.toLowerCase().split("-")[0] ?? "";
    if ((LOCALES as readonly string[]).includes(base)) return base as Locale;
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const detected = detectLocale();
    setLocaleState(detected);
    document.documentElement.lang = detected;
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      interpolate(dict[locale][key] ?? dict.en[key], vars),
    [locale],
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Reads a per-language JSONB column with graceful fallback. */
export function localized(value: unknown, locale: Locale): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const ordered = [locale, "en", "pt", "es"];
  for (const key of ordered) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return "";
}
