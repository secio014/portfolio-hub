-- blog_posts only tracked `published_at` (set when first published) and
-- `updated_at`. The public post page wants to show when a post was
-- originally written vs. last edited, so add a real creation timestamp.
-- Existing rows are backfilled from `published_at` (or `updated_at` for
-- unpublished drafts) since there's no better source of truth for them.
ALTER TABLE public.blog_posts
  ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.blog_posts
  SET created_at = COALESCE(published_at, updated_at);
