import { Languages, Moon, Sun } from "lucide-react";
import { useI18n, LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Shared language + theme switcher for screens outside the main Header (404, admin). */
export function ThemeLangControls({ className = "" }: { className?: string }) {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggle } = useTheme();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label={t("lang.switch")} className="font-mono text-xs">
            <Languages className="size-4" />
            {LOCALE_LABELS[locale]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {LOCALES.map((code) => (
            <DropdownMenuItem key={code} onClick={() => setLocale(code)} className="font-mono text-xs">
              {LOCALE_LABELS[code]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" onClick={toggle} aria-label={t("theme.toggle")}>
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </div>
  );
}
