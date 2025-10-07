-- Add FK from contracts.application_id to credit_applications.id
ALTER TABLE public.contracts
ADD CONSTRAINT fk_contracts_application_id
FOREIGN KEY (application_id)
REFERENCES public.credit_applications(id)
ON DELETE CASCADE;