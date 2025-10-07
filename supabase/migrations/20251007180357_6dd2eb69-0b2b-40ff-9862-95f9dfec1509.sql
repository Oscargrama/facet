-- Add client_name column to credit_applications to store name at time of application
ALTER TABLE public.credit_applications
ADD COLUMN client_name TEXT;

-- Update existing records to populate client_name from profiles
UPDATE public.credit_applications ca
SET client_name = p.full_name
FROM public.profiles p
WHERE ca.user_id = p.id AND ca.client_name IS NULL;