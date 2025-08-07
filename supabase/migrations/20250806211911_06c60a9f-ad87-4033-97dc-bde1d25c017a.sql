-- Limpar versões antigas das funções
DROP FUNCTION IF EXISTS public.set_user_pin(uuid, text);
DROP FUNCTION IF EXISTS public.verify_user_pin(uuid, text);

-- Verificar se a extensão pgcrypto está ativa (usando extname em vez de name)
SELECT extname FROM pg_extension WHERE extname = 'pgcrypto';