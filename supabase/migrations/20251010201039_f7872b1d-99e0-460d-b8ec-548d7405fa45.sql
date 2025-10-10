-- Fix critical security issue: Remove public access to contract_signatures
-- The get-signing-data edge function already uses service role to access this data

-- Drop the dangerous public SELECT policy
DROP POLICY IF EXISTS "Anyone can view pending signatures with valid token" ON public.contract_signatures;

-- Ensure only service role can access sensitive signature data
-- (Edge functions use service role automatically)

-- Add policy to allow users to view their own contracts' signatures
CREATE POLICY "Users can view signatures for their own contracts" 
ON public.contract_signatures 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE contracts.id = contract_signatures.contract_id 
    AND contracts.user_id = auth.uid()
  )
);

-- Fix OTP verifications table - add user policy
-- Users can only see their own OTP verification attempts
CREATE POLICY "Users can view their own OTP verifications"
ON public.otp_verifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contract_signatures cs
    JOIN public.contracts c ON c.id = cs.contract_id
    WHERE cs.id = otp_verifications.signature_id
    AND c.user_id = auth.uid()
  )
);