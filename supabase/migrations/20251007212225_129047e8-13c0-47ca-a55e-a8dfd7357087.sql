-- Fix monthly_payment column type to support decimal values
ALTER TABLE contracts 
ALTER COLUMN monthly_payment TYPE numeric USING monthly_payment::numeric;