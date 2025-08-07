-- Ensure member_requests table exists with correct structure
CREATE TABLE IF NOT EXISTS public.member_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cpf TEXT,
  phone TEXT,
  birth_date DATE,
  address TEXT,
  congregation TEXT,
  congregation_id UUID REFERENCES public.congregations(id),
  bio TEXT,
  requested_role TEXT NOT NULL CHECK (requested_role IN ('membro', 'aluno', 'professor')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'em_analise')),
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_requests_status ON public.member_requests(status);
CREATE INDEX IF NOT EXISTS idx_member_requests_email ON public.member_requests(email);
CREATE INDEX IF NOT EXISTS idx_member_requests_cpf ON public.member_requests(cpf);
CREATE INDEX IF NOT EXISTS idx_member_requests_congregation_id ON public.member_requests(congregation_id);
CREATE INDEX IF NOT EXISTS idx_member_requests_created_at ON public.member_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.member_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can insert member requests" ON public.member_requests
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Admins and coordinators can view all member requests" ON public.member_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'coordenador', 'secretario')
    )
  );

CREATE POLICY "Admins and coordinators can update member requests" ON public.member_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'coordenador', 'secretario')
    )
  );

-- Create trigger for updating timestamp
CREATE OR REPLACE FUNCTION public.update_member_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_member_request_timestamp ON public.member_requests;
CREATE TRIGGER trigger_update_member_request_timestamp
  BEFORE UPDATE ON public.member_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_member_request_timestamp();