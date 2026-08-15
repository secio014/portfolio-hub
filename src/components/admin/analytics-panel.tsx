import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { AdminCard, EmptyState, PanelHeader, type Row } from "./kit";

type Bucket = { label: string; count: number };

function tally(rows: Row[], pick: (row: Row) => string | null) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = pick(row);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function AnalyticsPanel() {
  const { t } = useI18n();
  const { data: events = [] } = useQuery<Row[]>({
    queryKey: ["admin", "analytics_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const pageViews = events.filter((event) => event["event_type"] === "page_view");
  const clicks = events.filter((event) => event["event_type"] !== "page_view");
  const last7 = events.filter(
    (event) => Date.now() - new Date(String(event["created_at"])).getTime() < 7 * 864e5,
  );

  const topPages = tally(pageViews, (row) => String(row["page_or_project_id"] ?? ""));
  const topProjects = tally(clicks, (row) => String(row["page_or_project_id"] ?? ""));
  const topReferrers = tally(events, (row) => {
    const value = String(row["referrer"] ?? "").trim();
    if (!value) return t("admin.analytics.direct");
    try {
      return new URL(value).hostname;
    } catch {
      return value;
    }
  });

  return (
    <div className="space-y-4">
      <PanelHeader title="analytics" hint={t("admin.analytics.hint")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Counter label={t("admin.analytics.pageViews")} value={pageViews.length} />
        <Counter label={t("admin.analytics.interactions")} value={clicks.length} />
        <Counter label={t("admin.analytics.events7d")} value={last7.length} />
      </div>

      {events.length === 0 ? <EmptyState label={t("admin.analytics.empty")} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <BarList title={t("admin.analytics.topPages")} buckets={topPages} />
        <BarList title={t("admin.analytics.topProjects")} buckets={topProjects} />
        <BarList title={t("admin.analytics.topReferrers")} buckets={topReferrers} />
      </div>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel panel-glow p-4">
      <p className="mono-label">{label}</p>
      <p className="mt-1 font-mono text-3xl font-bold text-signal tabular-nums">{value}</p>
    </div>
  );
}

function BarList({ title, buckets }: { title: string; buckets: Bucket[] }) {
  const { t } = useI18n();
  const max = buckets.reduce((peak, bucket) => Math.max(peak, bucket.count), 1);
  return (
    <AdminCard>
      <p className="mono-label">{title}</p>
      {buckets.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">{t("admin.analytics.noData")}</p>
      ) : (
        <ul className="space-y-2">
          {buckets.map((bucket) => (
            <li key={bucket.label} className="space-y-1">
              <div className="flex items-center justify-between gap-3 font-mono text-[11px]">
                <span className="truncate">{bucket.label}</span>
                <span className="text-signal tabular-nums">{bucket.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-signal"
                  style={{ width: `${Math.round((bucket.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
