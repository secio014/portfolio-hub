import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

type Line = { text: string; kind: "input" | "output" | "hint" };

export function Terminal({
  email,
  github,
  linkedin,
  skills,
  ownerName,
  yearsCoding,
}: {
  email: string;
  github: string;
  linkedin: string;
  skills: string[];
  ownerName?: string | undefined;
  yearsCoding?: number | undefined;
}) {
  const { t } = useI18n();
  const banner: Line[] = [{ text: t("terminal.bannerHint"), kind: "hint" }];
  const [lines, setLines] = useState<Line[]>(banner);
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLines(banner);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  function run(raw: string) {
    const command = raw.trim();
    if (!command) return;
    if (command === "clear") {
      setLines(banner);
      return;
    }

    const name = ownerName || "pedro";
    const years = yearsCoding && yearsCoding > 0 ? yearsCoding : 1;

    const output: string[] = (() => {
      switch (command) {
        case "help":
          return [
            `whoami            ${t("terminal.helpWhoami")}`,
            `skills --list     ${t("terminal.helpSkills")}`,
            `contact --email   ${t("terminal.helpContact")}`,
            `socials           ${t("terminal.helpSocials")}`,
            `uptime            ${t("terminal.helpUptime")}`,
            `sudo make coffee  ${t("terminal.helpCoffee")}`,
            `clear             ${t("terminal.helpClear")}`,
          ];
        case "whoami":
          return [t("terminal.whoami1", { name }), t("terminal.whoami2"), t("terminal.whoami3")];
        case "skills --list":
        case "skills":
          return skills.length ? skills.map((skill) => `• ${skill}`) : [t("terminal.noSkills")];
        case "contact --email":
        case "contact":
          return [email || t("terminal.emailMissing")];
        case "socials":
          return [`github:   ${github}`, `linkedin: ${linkedin}`];
        case "uptime":
          return [t("terminal.uptime", { years })];
        case "sudo make coffee":
          return [t("terminal.coffee")];
        case "ls":
          return [t("terminal.ls")];
        default:
          return [t("terminal.notFound", { command }), t("terminal.notFoundHint")];
      }
    })();

    setLines((current) => [
      ...current,
      { text: command, kind: "input" },
      ...output.map((text) => ({ text, kind: "output" as const })),
    ]);
  }

  return (
    <div className="panel overflow-hidden bg-card">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <span className="size-2.5 rounded-full bg-destructive/70" />
        <span className="size-2.5 rounded-full bg-warn/70" />
        <span className="size-2.5 rounded-full bg-signal/70" />
        <span className="ml-2 font-mono text-[11px] text-muted-foreground">
          bash — {ownerName || "pedro"}@portfolio
        </span>
      </div>
      <div
        ref={scrollRef}
        className="h-56 overflow-y-auto p-3 font-mono text-xs leading-relaxed sm:h-64 sm:text-[13px]"
      >
        {lines.map((line, index) => (
          <p
            key={index}
            className={
              line.kind === "input"
                ? "text-foreground"
                : line.kind === "hint"
                  ? "text-muted-foreground"
                  : "text-muted-foreground"
            }
          >
            {line.kind === "input" ? <span className="text-signal">$ </span> : null}
            {line.text}
          </p>
        ))}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(value);
            setValue("");
          }}
          className="flex items-center gap-1.5 pt-1"
        >
          <span className="text-signal">$</span>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-label={t("terminal.inputLabel")}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent font-mono text-xs outline-none sm:text-[13px]"
          />
        </form>
      </div>
    </div>
  );
}
