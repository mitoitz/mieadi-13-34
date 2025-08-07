-- Remover todas as políticas problemáticas
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Criar função de segurança para evitar recursão infinita
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(role::text, 'membro') FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Criar políticas corretas sem recursão
CREATE POLICY "Anyone can view profiles" ON public.profiles 
FOR SELECT USING (true);

CREATE POLICY "Admins can manage all profiles" ON public.profiles 
FOR ALL USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can update their own profile" ON public.profiles 
FOR UPDATE USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles 
FOR INSERT WITH CHECK (id = auth.uid());

-- Garantir que RLS está habilitada
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;