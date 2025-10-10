-- Drop the existing check constraint
ALTER TABLE public.contract_signatures 
DROP CONSTRAINT IF EXISTS contract_signatures_status_check;

-- Add updated check constraint with otp_verified and completed status
ALTER TABLE public.contract_signatures 
ADD CONSTRAINT contract_signatures_status_check 
CHECK (status IN ('pending', 'otp_verified', 'signed', 'completed', 'expired', 'cancelled'));