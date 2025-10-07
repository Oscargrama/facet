-- Remove duplicate foreign key constraints that are causing query ambiguity
ALTER TABLE contracts 
DROP CONSTRAINT IF EXISTS fk_contracts_application_id;