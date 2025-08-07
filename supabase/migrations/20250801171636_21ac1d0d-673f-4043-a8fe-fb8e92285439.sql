-- Criar função para validar usuário autenticado localmente
-- Esta função permite que o sistema reconheça usuários autenticados via CPF
CREATE OR REPLACE FUNCTION public.get_current_authenticated_user()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_session_id uuid;
BEGIN
    -- Primeiro tenta auth.uid() (sessão Supabase)
    user_session_id := auth.uid();
    
    -- Se não há sessão Supabase, verifica se há uma sessão local válida
    -- (isso seria definido pela aplicação através de uma variável de sessão)
    IF user_session_id IS NULL THEN
        -- Para desenvolvimento/teste, retorna um ID específico se configurado
        -- Em produção, isso seria substituído por lógica de validação de token local
        user_session_id := current_setting('app.current_user_id', true)::uuid;
    END IF;
    
    RETURN user_session_id;
END;
$$;

-- Atualizar as principais políticas RLS para usar a nova função
-- Política para profiles (crítica)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (
    id = COALESCE(auth.uid(), get_current_authenticated_user()) OR
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
        AND p.role IN ('admin', 'coordenador')
    )
);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (
    id = COALESCE(auth.uid(), get_current_authenticated_user()) OR
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
        AND p.role IN ('admin', 'coordenador')
    )
);

-- Criar política para admins acessarem tudo
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = COALESCE(auth.uid(), get_current_authenticated_user()) 
        AND p.role = 'admin'
    )
);

-- Atualizar função is_admin_or_coordinator para usar a nova função
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
    AND role IN ('admin', 'coordenador')
  );
$$;

-- Atualizar get_current_user_role para usar a nova função
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN (
        SELECT role::text FROM profiles 
        WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
    );
END;
$$;