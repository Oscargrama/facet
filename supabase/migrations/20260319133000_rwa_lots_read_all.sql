-- Allow authenticated users to read lots (investor view)
CREATE POLICY "authenticated can view rwa lots"
ON public.rwa_lots FOR SELECT
USING (auth.role() = 'authenticated');
