-- Fix gender check constraint to allow NULL values
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_gender_check CHECK (gender IS NULL OR gender IN ('masculino', 'feminino'));