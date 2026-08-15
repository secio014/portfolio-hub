-- Splits career_timeline entries into "study" (education) and "work" (professional experience).
ALTER TABLE public.career_timeline
  ADD COLUMN type TEXT NOT NULL DEFAULT 'work' CHECK (type IN ('work', 'study'));
