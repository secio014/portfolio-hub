-- `projects` rows for GitHub-synced repos are override/metadata rows layered
-- on top of `github_repos_cache` (always publicly readable) — the repo still
-- shows up from the cache even with no override row at all. The old
-- `visible = true` SELECT policy hid the override row itself from anon
-- whenever an admin set visible=false, so the client never learned the repo
-- was hidden and fell back to showing it anyway (buildProjects() treats "no
-- override" as visible). Reads are already filtered client-side in
-- buildProjects(), so let anon read every row (same pattern as
-- `github_repos_cache`) and rely on that client-side filter instead.
DROP POLICY "public read projects" ON public.projects;
CREATE POLICY "public read projects" ON public.projects FOR SELECT USING (true);
