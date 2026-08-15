-- Splits the GitHub contribution calendar into personal vs organization
-- activity, so the home page can show them as two separate graphs when a
-- github_org is configured. `total_contributions`/`days` keep meaning
-- "personal" (org activity subtracted out); the new columns hold the
-- org-only calendar and default to empty when no org is configured.

ALTER TABLE public.github_activity_cache
  ADD COLUMN org_total_contributions INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN org_days JSONB NOT NULL DEFAULT '[]'::jsonb;
