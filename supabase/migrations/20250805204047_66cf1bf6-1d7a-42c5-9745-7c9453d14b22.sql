-- Primeiro, desabilita a policy problemática (caso ela exista)
DROP POLICY IF EXISTS "Usuários só veem seus próprios dados" ON profiles;

-- Agora, recrie a policy corretamente, sem risco de recursão
CREATE POLICY "Usuários só veem seus próprios dados"
ON profiles
FOR SELECT
USING (
  id = auth.uid()
);