-- Reabilitando RLS na tabela login_attempts para manter segurança
-- mas criando uma política que bloqueia todos os acessos já que não é utilizada
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Política que bloqueia qualquer acesso já que a tabela não é utilizada no código
CREATE POLICY "Block all access to unused table" ON public.login_attempts
  FOR ALL 
  USING (false)
  WITH CHECK (false);

-- Comentário: A tabela login_attempts não é utilizada no código,
-- então criamos uma política que bloqueia todos os acessos para manter segurança.