-- Limpar versões antigas das funções
DROP FUNCTION IF EXISTS public.set_user_pin(uuid, text);
DROP FUNCTION IF EXISTS public.verify_user_pin(uuid, text);

-- Verificar se a extensão pgcrypto está ativa
SELECT name FROM pg_extension WHERE name = 'pgcrypto';