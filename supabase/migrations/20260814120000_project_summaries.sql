-- Auto-generated "quick summary" shown in the project modal on click.
-- Lives directly on `projects` (same jsonb-per-locale pattern as
-- title/description) so it's generated once at creation/sync time, cached,
-- and freely editable by the admin afterwards — never regenerated just by
-- opening the modal.
ALTER TABLE public.projects ADD COLUMN summary JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Needed so the GitHub sync can upsert a summary-only override row for a
-- repo (`source = 'github'`) without racing/duplicating on repeated syncs.
CREATE UNIQUE INDEX projects_github_repo_id_key ON public.projects (github_repo_id)
  WHERE github_repo_id IS NOT NULL;
