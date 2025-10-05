-- Add INSERT policy for payments table
-- This ensures only authenticated users can create payments and only for their own contracts
CREATE POLICY "Users can insert their own payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);