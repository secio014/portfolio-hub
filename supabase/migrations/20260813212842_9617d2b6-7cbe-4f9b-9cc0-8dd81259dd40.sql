CREATE TABLE IF NOT EXISTS public.sec_test_tmp (id int primary key);
INSERT INTO public.sec_test_tmp VALUES (1) ON CONFLICT DO NOTHING;
GRANT SELECT ON public.sec_test_tmp TO anon;
ALTER TABLE public.sec_test_tmp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tmp read" ON public.sec_test_tmp FOR SELECT TO anon USING (public.is_admin('00000000-0000-0000-0000-000000000000'::uuid) OR true);