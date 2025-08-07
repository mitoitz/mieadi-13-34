-- Corrigir políticas RLS para tabela profiles e atualizar usuário para admin

-- Primeiro, vamos verificar e corrigir as políticas da tabela profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Política para visualizar perfis - admin, coordenador e secretário podem ver todos
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'coordenador', 'secretario')
  ) OR id = auth.uid()
);

-- Política para atualizar perfis - admin, coordenador e secretário podem editar todos
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'coordenador', 'secretario')
  ) OR id = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'coordenador', 'secretario')
  ) OR id = auth.uid()
);

-- Política para inserir perfis
CREATE POLICY "Admins can create profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'coordenador', 'secretario')
  )
);

-- Atualizar o usuário específico para administrador
UPDATE public.profiles 
SET role = 'admin'::user_role,
    updated_at = now()
WHERE cpf = '046.241.473-67';