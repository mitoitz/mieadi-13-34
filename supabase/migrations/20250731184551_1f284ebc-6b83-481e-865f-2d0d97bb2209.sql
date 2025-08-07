-- Limpar políticas conflitantes na tabela subjects
DROP POLICY IF EXISTS "Allow all operations on subjects" ON public.subjects;
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;

-- Manter apenas a política de admin para todas as operações
-- A política "Only admins can manage subjects" já existe

-- Verificar e corrigir trigger para geração automática de código de disciplina
-- Se não existir, criar trigger
DROP TRIGGER IF EXISTS auto_subject_code_trigger ON public.subjects;

CREATE TRIGGER auto_subject_code_trigger
  BEFORE INSERT ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_subject_code();

-- Verificar se as tabelas têm campos obrigatórios corretos
-- Para subjects: name deve ser obrigatório
-- Para classes: name deve ser obrigatório

-- Adicionar política de visualização para usuários autenticados verem disciplinas
CREATE POLICY "Authenticated users can view subjects" 
ON public.subjects 
FOR SELECT 
TO authenticated
USING (true);

-- Verificar se existe problema com a função can_user_access_class
-- Testando se ela funciona corretamente
SELECT can_user_access_class('00000000-0000-0000-0000-000000000000'::uuid);