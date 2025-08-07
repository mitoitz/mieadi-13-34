-- Temporarily drop the unique constraint to allow data import
DROP INDEX IF EXISTS profiles_cpf_unique;

-- After import, we can recreate the constraint or handle duplicates as needed