-- Criar buckets de storage necessários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('materials', 'materials', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png']),
  ('certificates', 'certificates', false, 10485760, ARRAY['application/pdf']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Políticas para bucket materials (materiais de aula)
CREATE POLICY "Professores podem fazer upload de materiais"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('professor', 'admin', 'coordenador')
);

CREATE POLICY "Professores podem visualizar seus materiais"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials' AND
  (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'coordenador') OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Estudantes podem visualizar materiais de suas turmas"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials' AND
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.classes c ON e.class_id = c.id
    WHERE e.student_id = auth.uid()
    AND (storage.foldername(name))[2] = c.id::text
  )
);

-- Políticas para bucket certificates
CREATE POLICY "Admins podem gerenciar certificados"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'certificates' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'coordenador')
);

CREATE POLICY "Estudantes podem visualizar seus certificados"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para bucket avatars
CREATE POLICY "Usuários podem fazer upload de seus avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem visualizar avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Usuários podem atualizar seus avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Tabela para controle de mensagens inter-perfis
CREATE TABLE IF NOT EXISTS public.inter_profile_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'general' CHECK (message_type IN ('approval_request', 'notification', 'general', 'system')),
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas para mensagens
ALTER TABLE public.inter_profile_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver mensagens enviadas e recebidas"
ON public.inter_profile_messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Usuários podem enviar mensagens"
ON public.inter_profile_messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Usuários podem atualizar status de mensagens recebidas"
ON public.inter_profile_messages FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid());

-- Tabela para workflow de aprovações
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lesson_plan', 'grade_change', 'material', 'certificate')),
  entity_id UUID NOT NULL,
  requester_id UUID REFERENCES public.profiles(id) NOT NULL,
  approver_id UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  comments TEXT,
  decision_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas para aprovações
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas solicitações e aprovações"
ON public.approval_workflows FOR SELECT
TO authenticated
USING (requester_id = auth.uid() OR approver_id = auth.uid());

CREATE POLICY "Usuários podem criar solicitações"
ON public.approval_workflows FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Aprovadores podem atualizar status"
ON public.approval_workflows FOR UPDATE
TO authenticated
USING (approver_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inter_profile_messages_updated_at
  BEFORE UPDATE ON public.inter_profile_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at
  BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();