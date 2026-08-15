import { useI18n } from "@/lib/i18n";

type Day = { date: string; count: number };

function level(count: number) {
  if (count <= 0) return "bg-muted";
  if (count < 3) return "bg-signal/25";
  if (count < 6) return "bg-signal/50";
  if (count < 10) return "bg-signal/75";
  return "bg-signal";
}

/**
 * Buckets days into Sunday-Saturday weeks anchored to absolute calendar
 * dates, not array position. Personal and org calendars come from two
 * independent GitHub queries that can start on different weekdays (a
 * partial leading week), so index-based chunking (every 7 items) used to
 * shift one grid's rows relative to the other. Anchoring to real dates
 * means both grids' week columns line up on the same calendar week even if
 * their underlying arrays differ in length or start date.
 */
function toWeeks(days: Day[]): Day[][] {
  if (!days.length) return [];
  const byDate = new Map(days.map((day) => [day.date, day.count]));
  const times = days.map((day) => new Date(`${day.date}T00:00:00Z`).getTime());
  const start = new Date(Math.min(...times));
  const end = new Date(Math.max(...times));
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));

  const weeks: Day[][] = [];
  let week: Day[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const iso = cursor.toISOString().slice(0, 10);
    week.push({ date: iso, count: byDate.get(iso) ?? 0 });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  return weeks;
}

function Calendar({ label, days, total }: { label: string; days: Day[]; total: number }) {
  const { t } = useI18n();
  const weeks = toWeeks(days);

  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <p className="mono-label text-center">
        <span className="text-signal">{total}</span> {t("activity.contributions")}
        <span className="mt-0.5 block text-[10px] normal-case text-muted-foreground">{label}</span>
      </p>
      <div className="w-full pb-1">
        {weeks.length ? (
          <div
            className="grid w-full gap-[3px]"
            style={{
              gridTemplateRows: "repeat(7, minmax(0, 1fr))",
              gridAutoFlow: "column",
              gridAutoColumns: "minmax(0, 1fr)",
            }}
          >
            {weeks.flatMap((week) =>
              week.map((day) => (
                <span
                  key={day.date}
                  title={`${day.date}: ${day.count}`}
                  className={`aspect-square rounded-[2px] ${level(day.count)}`}
                />
              )),
            )}
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
