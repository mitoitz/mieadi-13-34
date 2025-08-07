-- Corrigir a estrutura da tabela member_requests para usar relacionamentos adequados

-- Primeiro, adicionar uma nova coluna congregation_id como UUID
ALTER TABLE public.member_requests 
ADD COLUMN congregation_id UUID REFERENCES public.congregations(id);

-- Migrar dados existentes: onde congregation é um UUID válido, mover para congregation_id
UPDATE public.member_requests 
SET congregation_id = congregation::uuid 
WHERE congregation ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Manter congregation como texto para casos onde é nome ao invés de UUID
-- Adicionar campos para auditoria melhorada
ALTER TABLE public.member_requests 
ADD COLUMN rejection_reason TEXT,
ADD COLUMN admin_notes TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_member_requests_status ON public.member_requests(status);
CREATE INDEX IF NOT EXISTS idx_member_requests_congregation_id ON public.member_requests(congregation_id);
CREATE INDEX IF NOT EXISTS idx_member_requests_created_at ON public.member_requests(created_at DESC);

-- Melhorar a constraint de status
ALTER TABLE public.member_requests 
ADD CONSTRAINT check_status CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'em_analise'));

-- Adicionar trigger para auditoria automática
CREATE OR REPLACE FUNCTION public.update_member_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_request_timestamp
  BEFORE UPDATE ON public.member_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_member_request_timestamp();