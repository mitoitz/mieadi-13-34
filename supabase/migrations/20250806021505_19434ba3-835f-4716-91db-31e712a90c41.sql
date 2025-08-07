-- Atualizar função get_current_authenticated_user para compatibilidade
CREATE OR REPLACE FUNCTION public.get_current_authenticated_user()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_data text;
    user_obj jsonb;
    user_id uuid;
BEGIN
    -- Tentar pegar do contexto do usuário local (CPF login)
    BEGIN
        user_data := current_setting('mieadi.current_user', true);
        IF user_data IS NOT NULL AND user_data != '' THEN
            user_obj := user_data::jsonb;
            user_id := (user_obj->>'id')::uuid;
            IF user_id IS NOT NULL THEN
                RETURN user_id;
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Continuar se falhar
    END;
    
    -- Fallback: retornar null se não há usuário
    RETURN NULL;
END;
$function$;