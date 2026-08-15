-- Replaces the single hard-coded "availability" badge (site_settings.
-- availability_enabled / availability_label) with `site_labels`: an
-- admin-managed list of small badges, each with its own text, target page
-- and placement on the site (header, hero, or top of page content).

-- ============ SITE LABELS ============
CREATE TABLE public.site_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  page_slug TEXT NOT NULL DEFAULT 'home' REFERENCES public.site_pages(slug) ON DELETE CASCADE,
  placement TEXT NOT NULL DEFAULT 'header' CHECK (placement IN ('header', 'hero', 'top')),
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_labels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_labels TO authenticated;
GRANT ALL ON public.site_labels TO service_role;
ALTER TABLE public.site_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read enabled labels" ON public.site_labels FOR SELECT USING (enabled = true);
CREATE POLICY "admin all labels" ON public.site_labels FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER t_site_labels_updated BEFORE UPDATE ON public.site_labels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_site_labels_page_slug ON public.site_labels (page_slug);

-- Carry over the existing availability badge, if any text was set.
INSERT INTO public.site_labels (text, enabled, page_slug, placement, "order")
SELECT availability_label, availability_enabled, 'home', 'hero', 0
FROM public.site_settings
WHERE availability_label IS NOT NULL AND availability_label <> '{}'::jsonb;

ALTER TABLE public.site_settings DROP COLUMN availability_enabled;
ALTER TABLE public.site_settings DROP COLUMN availability_label;
