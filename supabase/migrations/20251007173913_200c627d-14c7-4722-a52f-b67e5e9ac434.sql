-- Add FK from contract_signatures.contract_id to contracts.id
ALTER TABLE public.contract_signatures
ADD CONSTRAINT fk_contract_signatures_contract_id
FOREIGN KEY (contract_id)
REFERENCES public.contracts(id)
ON DELETE CASCADE;