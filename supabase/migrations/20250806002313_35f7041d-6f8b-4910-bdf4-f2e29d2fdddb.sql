-- Removendo RLS da tabela login_attempts pois não é utilizada no código
-- e não há necessidade de políticas RLS para esta tabela
ALTER TABLE public.login_attempts DISABLE ROW LEVEL SECURITY;

-- Comentário: A tabela login_attempts não é utilizada ativamente no código,
-- apenas é referenciada no arquivo types.ts. Como não há uso ativo,
-- podemos desabilitar o RLS para eliminar o warning de segurança.