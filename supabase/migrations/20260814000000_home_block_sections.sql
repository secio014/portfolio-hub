-- Registers the fixed home-page blocks (GitHub activity, tech stack, featured
-- projects, testimonials, writing) as site_sections rows of type 'block', so
-- their visibility can be toggled from the admin without allowing deletion.
INSERT INTO public.site_sections (section_key, "order", type, visible) VALUES
  ('activity', 4, 'block', true),
  ('stack', 5, 'block', true),
  ('featured', 6, 'block', true),
  ('testimonials', 7, 'block', true),
  ('blog', 8, 'block', true)
ON CONFLICT (section_key) DO NOTHING;
