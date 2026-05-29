-- 1. Delete the old crashing policy
DROP POLICY IF EXISTS "patient_self" ON public.patients;

-- 2. Turn RLS back on (just in case you disabled it to test)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- 3. Create the new, safe policy
CREATE POLICY "patient_self" ON public.patients
FOR ALL 
TO authenticated 
USING ( auth.uid() = user_id );