-- Corrigir políticas RLS para permitir que administradores editem todos os perfis

-- Remover políticas conflitantes
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and coordinators can manage all profiles" ON public.profiles;

-- Criar política unificada para UPDATE de perfis
CREATE POLICY "Profile update access"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  -- Usuário pode editar seu próprio perfil
  id = auth.uid() 
  OR 
  -- Admin, coordenador e secretário podem editar qualquer perfil
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'coordenador', 'secretario')
  )
)
WITH CHECK (
  -- Usuário pode editar seu próprio perfil
  id = auth.uid() 
  OR 
  -- Admin, coordenador e secretário podem editar qualquer perfil
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'coordenador', 'secretario')
  )
);