
-- ============ ADMIN IDENTITY ============
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id)
$$;

CREATE POLICY "admins read admin_users" ON public.admin_users FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ SITE SETTINGS ============
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  availability_enabled BOOLEAN NOT NULL DEFAULT true,
  availability_label JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  email TEXT,
  github_username TEXT,
  github_org TEXT,
  linkedin_url TEXT,
  linkedin_badge_slug TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admin write settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER t_site_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ MEDIA ============
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  alt_text JSONB NOT NULL DEFAULT '{}'::jsonb,
  linked_section_id UUID,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read media" ON public.media FOR SELECT USING (true);
CREATE POLICY "admin write media" ON public.media FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ SECTIONS ============
CREATE TABLE public.site_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  "order" INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  type TEXT NOT NULL DEFAULT 'text',
  title JSONB NOT NULL DEFAULT '{}'::jsonb,
  subtitle JSONB NOT NULL DEFAULT '{}'::jsonb,
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_sections TO authenticated;
GRANT ALL ON public.site_sections TO service_role;
ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read sections" ON public.site_sections FOR SELECT USING (visible = true);
CREATE POLICY "admin all sections" ON public.site_sections FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER t_sections_updated BEFORE UPDATE ON public.site_sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ GITHUB CACHE ============
CREATE TABLE public.github_repos_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_repo_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  language TEXT,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  html_url TEXT NOT NULL,
  homepage TEXT,
  stars INTEGER NOT NULL DEFAULT 0,
  forks INTEGER NOT NULL DEFAULT 0,
  is_org BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'study',
  pushed_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.github_repos_cache TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.github_repos_cache TO authenticated;
GRANT ALL ON public.github_repos_cache TO service_role;
ALTER TABLE public.github_repos_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read repos" ON public.github_repos_cache FOR SELECT USING (true);
CREATE POLICY "admin write repos" ON public.github_repos_cache FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.github_activity_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  total_contributions INTEGER NOT NULL DEFAULT 0,
  days JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.github_activity_cache TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.github_activity_cache TO authenticated;
GRANT ALL ON public.github_activity_cache TO service_role;
ALTER TABLE public.github_activity_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read activity" ON public.github_activity_cache FOR SELECT USING (true);
CREATE POLICY "admin write activity" ON public.github_activity_cache FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ PROJECTS ============
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title JSONB NOT NULL DEFAULT '{}'::jsonb,
  description JSONB NOT NULL DEFAULT '{}'::jsonb,
  slug TEXT UNIQUE,
  cover_image_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'production',
  tech JSONB NOT NULL DEFAULT '[]'::jsonb,
  repo_url TEXT,
  demo_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  visible BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  github_repo_id BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read projects" ON public.projects FOR SELECT USING (visible = true);
CREATE POLICY "admin all projects" ON public.projects FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER t_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RESUME ============
CREATE TABLE public.resume (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  file_url TEXT,
  file_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resume TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume TO authenticated;
GRANT ALL ON public.resume TO service_role;
ALTER TABLE public.resume ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read resume" ON public.resume FOR SELECT USING (true);
CREATE POLICY "admin write resume" ON public.resume FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER t_resume_updated BEFORE UPDATE ON public.resume FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ TIMELINE ============
CREATE TABLE public.career_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title JSONB NOT NULL DEFAULT '{}'::jsonb,
  institution TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE,
  description JSONB NOT NULL DEFAULT '{}'::jsonb,
  "order" INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.career_timeline TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_timeline TO authenticated;
GRANT ALL ON public.career_timeline TO service_role;
ALTER TABLE public.career_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read timeline" ON public.career_timeline FOR SELECT USING (visible = true);
CREATE POLICY "admin all timeline" ON public.career_timeline FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ CERTIFICATIONS ============
CREATE TABLE public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  issuer TEXT NOT NULL DEFAULT '',
  date DATE,
  credential_url TEXT,
  logo_media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.certifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certifications TO authenticated;
GRANT ALL ON public.certifications TO service_role;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read certs" ON public.certifications FOR SELECT USING (visible = true);
CREATE POLICY "admin all certs" ON public.certifications FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ CASE STUDIES ============
CREATE TABLE public.case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title JSONB NOT NULL DEFAULT '{}'::jsonb,
  problem JSONB NOT NULL DEFAULT '{}'::jsonb,
  approach JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.case_studies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_studies TO authenticated;
GRANT ALL ON public.case_studies TO service_role;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read cases" ON public.case_studies FOR SELECT USING (published = true);
CREATE POLICY "admin all cases" ON public.case_studies FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER t_cases_updated BEFORE UPDATE ON public.case_studies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ TESTIMONIALS ============
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  author_role JSONB NOT NULL DEFAULT '{}'::jsonb,
  quote JSONB NOT NULL DEFAULT '{}'::jsonb,
  photo_media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read testimonials" ON public.testimonials FOR SELECT USING (visible = true);
CREATE POLICY "admin all testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ BLOG ============
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title JSONB NOT NULL DEFAULT '{}'::jsonb,
  excerpt JSONB NOT NULL DEFAULT '{}'::jsonb,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  cover_media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read posts" ON public.blog_posts FOR SELECT USING (published = true);
CREATE POLICY "admin all posts" ON public.blog_posts FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER t_posts_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CONTACT ============
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read contact" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admin manage contact" ON public.contact_messages FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admin delete contact" ON public.contact_messages FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- ============ ANALYTICS ============
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  page_or_project_id TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.analytics_events TO anon;
GRANT SELECT, INSERT, DELETE ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "admin read events" ON public.analytics_events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ============ STORAGE ============
CREATE POLICY "public read portfolio bucket" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "admin upload portfolio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'portfolio' AND public.is_admin(auth.uid()));
CREATE POLICY "admin update portfolio" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'portfolio' AND public.is_admin(auth.uid()));
CREATE POLICY "admin delete portfolio" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'portfolio' AND public.is_admin(auth.uid()));

-- ============ SEED ============
INSERT INTO public.site_settings (owner_name, email, github_username, github_org, linkedin_url, availability_enabled, availability_label, metrics, tech_stack)
VALUES (
  'Pedro Schmitz Sécio',
  'pedro@example.com',
  'pedroschmitz',
  NULL,
  'https://www.linkedin.com/in/pedro-schmitz-secio/',
  true,
  '{"en":"Open to remote PJ offers","pt":"Aberto a propostas PJ remotas","es":"Abierto a ofertas PJ remotas"}'::jsonb,
  '{"projects":12,"technologies":18,"years":3}'::jsonb,
  '["TypeScript","JavaScript","React","Node.js","Java","Spring Boot","Python","PostgreSQL","Docker","AWS","Git","Tailwind CSS"]'::jsonb
);

INSERT INTO public.site_sections (section_key, "order", type, title, subtitle, body) VALUES
('hero', 1, 'hero',
 '{"en":"Software Engineer building reliable systems","pt":"Engenheiro de Software construindo sistemas confiáveis","es":"Ingeniero de Software construyendo sistemas confiables"}'::jsonb,
 '{"en":"Software Engineering student at FIAP · Technology Intern at Tokio Marine Brasil","pt":"Estudante de Engenharia de Software na FIAP · Estagiário de Tecnologia na Tokio Marine Brasil","es":"Estudiante de Ingeniería de Software en FIAP · Pasante de Tecnología en Tokio Marine Brasil"}'::jsonb,
 '{"en":"I design and ship web platforms with a focus on clean architecture, performance and developer experience.","pt":"Projeto e entrego plataformas web com foco em arquitetura limpa, performance e experiência do desenvolvedor.","es":"Diseño y entrego plataformas web con foco en arquitectura limpia, rendimiento y experiencia del desarrollador."}'::jsonb),
('about', 2, 'text',
 '{"en":"About","pt":"Sobre","es":"Sobre mí"}'::jsonb,
 '{"en":"Academic background, internship and stack","pt":"Formação acadêmica, estágio e stack","es":"Formación académica, pasantía y stack"}'::jsonb,
 '{"en":"I am a Software Engineering student at FIAP and a Technology Intern at Tokio Marine Brasil, where I work close to production systems, integrations and internal tooling. I care about maintainable code, observability and shipping things people actually use.","pt":"Sou estudante de Engenharia de Software na FIAP e Estagiário de Tecnologia na Tokio Marine Brasil, onde atuo próximo a sistemas de produção, integrações e ferramentas internas. Valorizo código sustentável, observabilidade e entregar coisas que as pessoas realmente usam.","es":"Soy estudiante de Ingeniería de Software en FIAP y pasante de Tecnología en Tokio Marine Brasil, donde trabajo cerca de sistemas de producción, integraciones y herramientas internas. Me importa el código mantenible, la observabilidad y entregar cosas que la gente realmente usa."}'::jsonb),
('contact', 3, 'contact',
 '{"en":"Get in touch","pt":"Entre em contato","es":"Contacto"}'::jsonb,
 '{"en":"Open to freelance, PJ and collaboration","pt":"Aberto a freelance, PJ e colaborações","es":"Abierto a freelance, PJ y colaboraciones"}'::jsonb,
 '{}'::jsonb);

INSERT INTO public.career_timeline (title, institution, start_date, end_date, description, "order") VALUES
('{"en":"B.Sc. Software Engineering","pt":"Bacharelado em Engenharia de Software","es":"Ingeniería de Software"}'::jsonb, 'FIAP', '2023-02-01', NULL,
 '{"en":"Focused on software architecture, distributed systems and cloud.","pt":"Foco em arquitetura de software, sistemas distribuídos e cloud.","es":"Enfocado en arquitectura de software, sistemas distribuidos y cloud."}'::jsonb, 1),
('{"en":"Technology Intern","pt":"Estagiário de Tecnologia","es":"Pasante de Tecnología"}'::jsonb, 'Tokio Marine Brasil', '2024-06-01', NULL,
 '{"en":"Supporting internal platforms, integrations and automation.","pt":"Apoio a plataformas internas, integrações e automações.","es":"Apoyo a plataformas internas, integraciones y automatizaciones."}'::jsonb, 2);

INSERT INTO public.resume (file_url, file_name) VALUES (NULL, NULL);
INSERT INTO public.github_activity_cache (total_contributions, days) VALUES (0, '[]'::jsonb);
