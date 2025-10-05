-- Eliminar políticas actuales
DROP POLICY IF EXISTS "Users can create their own applications" ON public.credit_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.credit_applications;
DROP POLICY IF EXISTS "Users can update their own pending applications" ON public.credit_applications;

-- Crear nueva política INSERT para usuarios autenticados
CREATE POLICY "Enable insert for authenticated users"
ON public.credit_applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Crear nueva política SELECT para usuarios autenticados
CREATE POLICY "Enable select for authenticated users"
ON public.credit_applications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Crear nueva política UPDATE para usuarios autenticados
CREATE POLICY "Enable update for authenticated users"
ON public.credit_applications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);