-- Adicionar campo professor_id na tabela subjects se não existir
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES public.profiles(id);