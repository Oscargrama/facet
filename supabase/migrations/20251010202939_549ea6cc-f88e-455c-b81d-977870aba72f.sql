-- Fix RLS policy for contracts to allow status updates when sending for signature
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update their own draft contracts" ON public.contracts;

-- Create new policy that allows updating contracts that are in draft or already sent
-- This allows users to update their contracts when sending them for signature
CREATE POLICY "Users can update their own contracts" 
ON public.contracts 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);