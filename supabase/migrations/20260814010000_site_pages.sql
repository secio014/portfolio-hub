-- Introduces `site_pages`: every page the admin can manage (the 5 built-in
-- routes plus any custom pages created from the admin dashboard), and links
-- `site_sections` rows to the page they render on via `page_slug`. This
-- powers the admin's per-page accordion navigation and lets custom sections
-- be created on — or moved between — any page, not just the home page.

-- ============ SITE PAGES ============
CREATE TABLE public.site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title JSONB NOT NULL DEFAULT '{}'::jsonb,
  nav_visible BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
GRANT ALL ON public.site_pages TO service_role;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pages" ON public.site_pages FOR SELECT USING (true);
CREATE POLICY "admin write pages" ON public.site_pages FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admin update pages" ON public.site_pages FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admin delete pages" ON public.site_pages FOR DELETE TO authenticated USING (public.is_admin(auth.uid()) AND is_system = false);
CREATE TRIGGER t_site_pages_updated BEFORE UPDATE ON public.site_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_pages (slug, title, is_system, "order") VALUES
  ('home', '{"en":"Home","pt":"Início","es":"Inicio"}'::jsonb, true, 1),
  ('about', '{"en":"About","pt":"Sobre","es":"Sobre mí"}'::jsonb, true, 2),
  ('projects', '{"en":"Projects","pt":"Projetos","es":"Proyectos"}'::jsonb, true, 3),
  ('blog', '{"en":"Blog","pt":"Blog","es":"Blog"}'::jsonb, true, 4),
  ('contact', '{"en":"Contact","pt":"Contato","es":"Contacto"}'::jsonb, true, 5)
ON CONFLICT (slug) DO NOTHING;

-- ============ SECTIONS: page assignment ============
ALTER TABLE public.site_sections
  ADD COLUMN page_slug TEXT NOT NULL DEFAULT 'home' REFERENCES public.site_pages(slug) ON DELETE CASCADE;

UPDATE public.site_sections SET page_slug = 'about' WHERE section_key = 'about';
UPDATE public.site_sections SET page_slug = 'contact' WHERE section_key = 'contact';

CREATE INDEX idx_site_sections_page_slug ON public.site_sections (page_slug);
