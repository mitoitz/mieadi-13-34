-- Drop the unique constraint on cpf to allow multiple NULL/empty values
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cpf_key;

-- Add a partial unique constraint that only applies to non-empty CPF values
CREATE UNIQUE INDEX profiles_cpf_unique ON public.profiles (cpf) WHERE cpf IS NOT NULL AND cpf != '';