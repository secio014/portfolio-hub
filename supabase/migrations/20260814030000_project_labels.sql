-- Replaces the fixed production/study/experiment enum on `projects` with
-- `project_labels`: an admin-managed, colorable list of project categories.
-- Admins can rename the built-in three, recolor them, reorder them, and add
-- fully custom labels — then assign one label per project.

-- ============ PROJECT LABELS ============
CREATE TABLE public.project_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE,
  name JSONB NOT NULL DEFAULT '{}'::jsonb,
  color TEXT NOT NULL DEFAULT 'signal',
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.project_labels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_labels TO authenticated;
GRANT ALL ON public.project_labels TO service_role;
ALTER TABLE public.project_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read project labels" ON public.project_labels FOR SELECT USING (true);
CREATE POLICY "admin all project labels" ON public.project_labels FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER t_project_labels_updated BEFORE UPDATE ON public.project_labels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.project_labels (key, name, color, "order") VALUES
  ('production', '{"en":"Production","pt":"Produção","es":"Producción"}'::jsonb, 'signal', 1),
  ('study', '{"en":"Study","pt":"Estudo","es":"Estudio"}'::jsonb, 'chart-2', 2),
  ('experiment', '{"en":"Experiment","pt":"Experimento","es":"Experimento"}'::jsonb, 'chart-4', 3);

-- ============ PROJECTS: switch category text -> label_id ============
ALTER TABLE public.projects ADD COLUMN label_id UUID REFERENCES public.project_labels(id) ON DELETE SET NULL;

UPDATE public.projects p
SET label_id = l.id
FROM public.project_labels l
WHERE l.key = p.category;

ALTER TABLE public.projects DROP COLUMN category;
CREATE INDEX idx_projects_label_id ON public.projects (label_id);
