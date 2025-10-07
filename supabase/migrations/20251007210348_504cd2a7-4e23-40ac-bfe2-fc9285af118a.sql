-- Remove duplicate foreign key constraint
ALTER TABLE contract_signatures 
DROP CONSTRAINT IF EXISTS fk_contract_signatures_contract_id;