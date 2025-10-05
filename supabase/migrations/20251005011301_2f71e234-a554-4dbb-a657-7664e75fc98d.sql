-- Add INSERT policy for contracts table
-- This ensures only authenticated users can create contracts and only for themselves
CREATE POLICY "Enable insert for authenticated users"
ON public.contracts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);