-- Lets admins add repeatable "divs" (blocks) inside any existing section
-- (hero, about, contact, or any custom section, on any page) instead of a
-- single markdown body — each block has its own title/body, and the
-- section picks how they're laid out: vertical (stacked), horizontal (an
-- auto-fit grid — no manual column count needed), or carousel (swipeable).

ALTER TABLE public.site_sections
  ADD COLUMN layout TEXT NOT NULL DEFAULT 'vertical' CHECK (layout IN ('vertical', 'horizontal', 'carousel'));

CREATE TABLE public.section_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.site_sections(id) ON DELETE CASCADE,
  title JSONB NOT NULL DEFAULT '{}'::jsonb,
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.section_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.section_blocks TO authenticated;
GRANT ALL ON public.section_blocks TO service_role;
ALTER TABLE public.section_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read visible section blocks" ON public.section_blocks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.site_sections s WHERE s.id = section_blocks.section_id AND s.visible = true)
);
CREATE POLICY "admin all section blocks" ON public.section_blocks FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER t_section_blocks_updated BEFORE UPDATE ON public.section_blocks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_section_blocks_section_id ON public.section_blocks (section_id);
