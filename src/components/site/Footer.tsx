import { Github, Linkedin, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer({
  email,
  githubUrl,
  linkedinUrl,
  ownerName,
}: {
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  ownerName: string;
}) {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} {ownerName}
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{t("footer.built")}</p>
        </div>
        <div className="flex items-center gap-3">
          {email ? (
            <a
              href={`mailto:${email}`}
              aria-label="Email"
              className="text-muted-foreground hover:text-signal"
            >
              <Mail className="size-4" />
            </a>
          ) : null}
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub"
            className="text-muted-foreground hover:text-signal"
          >
            <Github className="size-4" />
          </a>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="LinkedIn"
            className="text-muted-foreground hover:text-signal"
          >
            <Linkedin className="size-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
