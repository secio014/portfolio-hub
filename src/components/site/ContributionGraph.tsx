import { useI18n } from "@/lib/i18n";

type Day = { date: string; count: number };

function level(count: number) {
  if (count <= 0) return "bg-muted";
  if (count < 3) return "bg-signal/25";
  if (count < 6) return "bg-signal/50";
  if (count < 10) return "bg-signal/75";
  return "bg-signal";
}

function Calendar({ label, days, total }: { label: string; days: Day[]; total: number }) {
  const { t } = useI18n();
  const weeks: Day[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <p className="mono-label text-center">
        <span className="text-signal">{total}</span> {t("activity.contributions")}
        <span className="mt-0.5 block text-[10px] normal-case text-muted-foreground">{label}</span>
      </p>
      <div className="w-full overflow-x-auto pb-1">
        {weeks.length ? (
          <div className="mx-auto flex w-max gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <span
                    key={day.date}
                    title={`${day.date}: ${day.count}`}
                    className={`size-[9px] rounded-[2px] sm:size-[11px] ${level(day.count)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center font-mono text-xs text-muted-foreground">
            Activity cache is empty — it fills on the next scheduled GitHub sync.
          </p>
        )}
      </div>
    </div>
  );
}

export function ContributionGraph({
  personalDays,
  personalTotal,
  personalLabel,
  orgDays,
  orgTotal,
  orgLabel,
}: {
  personalDays: Day[];
  personalTotal: number;
  personalLabel: string;
  orgDays?: Day[] | undefined;
  orgTotal?: number | undefined;
  orgLabel?: string | undefined;
}) {
  const hasOrg = Boolean(orgLabel) && (orgDays?.length ?? 0) > 0;

  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <Calendar label={personalLabel} days={personalDays} total={personalTotal} />
        {hasOrg ? (
          <>
            <div className="hidden w-px shrink-0 bg-border lg:block" aria-hidden />
            <div className="h-px w-full bg-border lg:hidden" aria-hidden />
            <Calendar label={orgLabel!} days={orgDays!} total={orgTotal ?? 0} />
          </>
        ) : null}
      </div>
    </div>
  );
}
