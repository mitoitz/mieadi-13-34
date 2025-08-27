-- Criar tabela de super administradores
CREATE TABLE IF NOT EXISTS public.super_admins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    cpf TEXT NOT NULL UNIQUE,
    granted_by UUID REFERENCES public.profiles(id),
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Função para verificar se um usuário é super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário está na tabela super_admins e está ativo
    RETURN EXISTS (
        SELECT 1 FROM super_admins sa
        JOIN profiles p ON sa.user_id = p.id
        WHERE sa.user_id = user_id 
        AND sa.active = true
        AND p.status = 'ativo'
    );
END;
$$;