import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateSummaryText } from "@/lib/ai/summarize.server";

const GITHUB_API = "https://api.github.com";

/**
 * Accepts either a bare handle ("octocat") or a pasted profile URL
 * ("https://github.com/octocat", "github.com/octocat/", "@octocat") and
 * returns just the handle GitHub's REST API expects.
 */
function extractGithubHandle(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s?#]+)/i);
  if (urlMatch?.[1]) return urlMatch[1];
  return trimmed.replace(/^@/, "");
}

type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  private: boolean;
  archived: boolean;
  pushed_at: string | null;
};

async function githubFetch<T>(path: string, token: string | undefined): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "portfolio-hub-sync",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${path} failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Fetches a repo's README as plain markdown text (empty string if it has
 * none). Used as richer input for the AI summary than GitHub's one-line repo
 * description, both for auto-generation on sync and the admin's "generate
 * from README" action.
 */
export async function fetchReadme(fullName: string, token: string | undefined): Promise<string> {
  const res = await fetch(`${GITHUB_API}/repos/${fullName}/readme`, {
    headers: {
      Accept: "application/vnd.github.raw+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "portfolio-hub-sync",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return "";
  return res.text();
}

async function fetchAllRepos(owner: string, isOrg: boolean, token: string | undefined) {
  const repos: (GithubRepo & { is_org: boolean })[] = [];
  const base = isOrg ? `/orgs/${owner}/repos` : `/users/${owner}/repos`;
  for (let page = 1; page <= 5; page++) {
    const batch = await githubFetch<GithubRepo[]>(
      `${base}?per_page=100&page=${page}&sort=pushed&type=${isOrg ? "public" : "owner"}`,
      token,
    );
    repos.push(...batch.map((repo) => ({ ...repo, is_org: isOrg })));
    if (batch.length < 100) break;
  }
  return repos;
}

type ContributionDay = { date: string; count: number };

async function graphql<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
): Promise<T> {
  const res = await fetch(`${GITHUB_API}/graphql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "portfolio-hub-sync",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`GitHub GraphQL failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data as T;
}

type CalendarResponse = {
  totalContributions: number;
  weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
};

function daysFromCalendar(calendar: CalendarResponse): ContributionDay[] {
  return calendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount })),
  );
}

/**
 * Fetches the login's contribution calendar. When `orgLogin` is given, also
 * fetches the same calendar scoped to that org's repos (GitHub's
 * `contributionsCollection(organizationID:)`) and subtracts it day-by-day
 * from the overall total, so "personal" never double-counts org activity.
 * The org-scoped field only returns data when `login` is the token's own
 * account — if the org lookup or scoped query fails (wrong scope, org not
 * accessible, `login` isn't the token owner), we fall back to the overall
 * calendar as "personal" and skip the org split silently.
 */
async function fetchContributionCalendars(login: string, orgLogin: string | null, token: string) {
  const overallData = await graphql<{
    user?: { contributionsCollection?: { contributionCalendar?: CalendarResponse } };
  }>(
    `
      query ($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `,
    { login },
    token,
  );
  const overallCalendar = overallData.user?.contributionsCollection?.contributionCalendar;
  if (!overallCalendar) throw new Error("No contribution calendar returned for this user");
  const overallDays = daysFromCalendar(overallCalendar);

  if (!orgLogin) {
    return {
      personal: { total: overallCalendar.totalContributions, days: overallDays },
      org: { total: 0, days: [] as ContributionDay[] },
    };
  }

  try {
    const orgIdData = await graphql<{ organization?: { id: string } }>(
      `
        query ($org: String!) {
          organization(login: $org) {
            id
          }
        }
      `,
      { org: orgLogin },
      token,
    );
    const organizationID = orgIdData.organization?.id;
    if (!organizationID) throw new Error(`Organization "${orgLogin}" not found`);

    const scopedData = await graphql<{
      user?: { contributionsCollection?: { contributionCalendar?: CalendarResponse } };
    }>(
      `
        query ($login: String!, $organizationID: ID!) {
          user(login: $login) {
            contributionsCollection(organizationID: $organizationID) {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
            }
          }
        }
      `,
      { login, organizationID },
      token,
    );
    const orgCalendar = scopedData.user?.contributionsCollection?.contributionCalendar;
    if (!orgCalendar) throw new Error("No org-scoped contribution calendar returned");
    const orgDays = daysFromCalendar(orgCalendar);
    const orgByDate = new Map(orgDays.map((day) => [day.date, day.count]));

    const personalDays = overallDays.map((day) => ({
      date: day.date,
      count: Math.max(0, day.count - (orgByDate.get(day.date) ?? 0)),
    }));
    const personalTotal = Math.max(
      0,
      overallCalendar.totalContributions - orgCalendar.totalContributions,
    );

    return {
      personal: { total: personalTotal, days: personalDays },
      org: { total: orgCalendar.totalContributions, days: orgDays },
    };
  } catch {
    // Org-scoped contributions require `login` to be the token's own account.
    // Not fatal — just show everything under "personal" like before.
    return {
      personal: { total: overallCalendar.totalContributions, days: overallDays },
      org: { total: 0, days: [] as ContributionDay[] },
    };
  }
}

const schema = z.object({});

/**
 * Reports whether the server has a GITHUB_TOKEN configured, without ever
 * exposing the token itself. Used by the admin Settings panel to explain why
 * sync might be failing or contribution activity isn't updating.
 */
export const getGithubSyncStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (!isAdmin) throw new Error("Forbidden: admin access required");

    const { data: settings } = await context.supabase
      .from("site_settings")
      .select("github_username, github_org")
      .limit(1)
      .maybeSingle();

    return {
      hasToken: Boolean(process.env["GITHUB_TOKEN"]),
      username: settings?.github_username?.trim()
        ? extractGithubHandle(settings.github_username)
        : null,
      org: settings?.github_org?.trim() ? extractGithubHandle(settings.github_org) : null,
    };
  });

/**
 * Pulls the owner's public repositories (and org repos, if configured) plus
 * their GitHub contribution calendar, and writes them into the cache tables
 * that power the homepage. Admin-only: RLS on both cache tables rejects
 * writes from non-admin accounts even if this handler is reached.
 */
export const syncGithubData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input ?? {}))
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (!isAdmin) throw new Error("Forbidden: admin access required");

    const { data: settings, error: settingsError } = await context.supabase
      .from("site_settings")
      .select("github_username, github_org")
      .limit(1)
      .maybeSingle();
    if (settingsError) throw settingsError;

    const rawUsername = settings?.github_username?.trim();
    if (!rawUsername) {
      throw new Error("Set a GitHub username in Settings before syncing.");
    }
    const username = extractGithubHandle(rawUsername);
    const org = settings?.github_org?.trim() ? extractGithubHandle(settings.github_org) : null;

    const token = process.env["GITHUB_TOKEN"];

    const { data: summarized } = await context.supabase
      .from("projects")
      .select("github_repo_id, description")
      .not("github_repo_id", "is", null);
    const summarizedRepoIds = new Set(
      (summarized ?? [])
        .filter((row) => row.description && Object.keys(row.description as object).length > 0)
        .map((row) => row.github_repo_id),
    );

    const userRepos = await fetchAllRepos(username, false, token);
    const orgRepos = org ? await fetchAllRepos(org, true, token) : [];
    const allRepos = [...userRepos, ...orgRepos].filter((repo) => !repo.archived && !repo.private);

    const repoRows = allRepos.map((repo) => ({
      github_repo_id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      language: repo.language,
      topics: repo.topics ?? [],
      html_url: repo.html_url,
      homepage: repo.homepage || null,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      is_org: repo.is_org,
      category: repo.fork ? "study" : "production",
      pushed_at: repo.pushed_at,
      fetched_at: new Date().toISOString(),
    }));

    if (repoRows.length) {
      const { error: upsertError } = await context.supabase
        .from("github_repos_cache")
        .upsert(repoRows, { onConflict: "github_repo_id" });
      if (upsertError) throw upsertError;
    }

    const keepIds = repoRows.map((row) => row.github_repo_id);
    const { error: deleteError } = await context.supabase
      .from("github_repos_cache")
      .delete()
      .not("github_repo_id", "in", `(${keepIds.length ? keepIds.join(",") : "0"})`);
    if (deleteError) throw deleteError;

    // Auto-generate the project modal's description for any repo that
    // doesn't have one yet — new repos, and repos synced before this feature
    // existed (or where generation previously failed, e.g. no API key set).
    // Uses the repo's README as input when available (same richer source as
    // the admin's manual "Gerar via IA" button), falling back to GitHub's
    // one-line repo description. Cached once on `projects.description` (an
    // override row, same as featured/label overrides); never regenerated by
    // a later sync once set. Admins can edit or regenerate it afterwards
    // from the admin panel. Best-effort: a generation failure must never
    // fail the whole sync.
    const reposNeedingSummary = repoRows.filter(
      (row) => !summarizedRepoIds.has(row.github_repo_id),
    );
    for (const repo of reposNeedingSummary) {
      try {
        const readme = await fetchReadme(repo.full_name, token);
        const description = await generateSummaryText({
          title: repo.name,
          description: readme ? readme.slice(0, 6000) : (repo.description ?? ""),
          tech: [repo.language, ...(Array.isArray(repo.topics) ? repo.topics : [])].filter(
            (item): item is string => Boolean(item),
          ),
        });
        await context.supabase.from("projects").upsert(
          {
            source: "github",
            github_repo_id: repo.github_repo_id,
            description,
            visible: true,
          },
          { onConflict: "github_repo_id" },
        );
      } catch (err) {
        console.error(`[github-sync] description generation failed for ${repo.full_name}:`, err);
      }
    }

    let activitySynced = false;
    if (token) {
      const { personal, org: orgActivity } = await fetchContributionCalendars(username, org, token);
      const { error: activityError } = await context.supabase
        .from("github_activity_cache")
        .update({
          total_contributions: personal.total,
          days: personal.days,
          org_total_contributions: orgActivity.total,
          org_days: orgActivity.days,
          fetched_at: new Date().toISOString(),
        })
        .eq("singleton", true);
      if (activityError) throw activityError;
      activitySynced = true;
    }

    return {
      ok: true as const,
      reposSynced: repoRows.length,
      activitySynced,
      warning: activitySynced
        ? null
        : "GITHUB_TOKEN not set on the server — contribution activity was not updated.",
    };
  });
