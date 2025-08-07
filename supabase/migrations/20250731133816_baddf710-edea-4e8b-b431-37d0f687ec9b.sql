-- Corrigir políticas RLS para a tabela profiles
-- A política atual está incompleta - vamos criar uma política completa

-- Primeiro, vamos remover a política incompleta se existe
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;

-- Criar política completa para permitir acesso aos dados
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Verificar se a tabela tem RLS habilitada
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;