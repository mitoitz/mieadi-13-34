-- Adicionar campo sexo na tabela profiles
ALTER TABLE public.profiles ADD COLUMN gender text CHECK (gender IN ('masculino', 'feminino'));