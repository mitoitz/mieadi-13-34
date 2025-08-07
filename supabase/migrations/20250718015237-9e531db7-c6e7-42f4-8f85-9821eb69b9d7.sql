-- Migração completa do sistema MIEADI
-- Criação de todas as tabelas com relacionamentos corretos

-- 1. Tabela de Indicações de Membros (member_indications)
CREATE TABLE IF NOT EXISTS public.member_indications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  congregation_id UUID REFERENCES public.congregations(id),
  indicating_member_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Atualizar tabela class_materials para incluir campos em falta
ALTER TABLE public.class_materials 
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS material_type TEXT DEFAULT 'document';

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_member_indications_indicating_member ON public.member_indications(indicating_member_id);
CREATE INDEX IF NOT EXISTS idx_member_indications_congregation ON public.member_indications(congregation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_class_materials_teacher ON public.class_materials(teacher_id);

-- 5. Configurar RLS para member_indications
ALTER TABLE public.member_indications ENABLE ROW LEVEL SECURITY;

-- Políticas para member_indications
CREATE POLICY "Users can view their own indications"
  ON public.member_indications FOR SELECT
  USING (indicating_member_id = auth.uid());

CREATE POLICY "Users can create indications"
  ON public.member_indications FOR INSERT
  WITH CHECK (indicating_member_id = auth.uid());

CREATE POLICY "Admins can manage all indications"
  ON public.member_indications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'coordenador')
    )
  );

-- 6. Configurar RLS para notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('admin', 'coordenador')
    )
  );

-- 7. Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_indications_updated_at
  BEFORE UPDATE ON public.member_indications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Função para criar notificação
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT DEFAULT 'info',
  expires_in_hours INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
  expiry_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calcular tempo de expiração se fornecido
  IF expires_in_hours IS NOT NULL THEN
    expiry_time := now() + (expires_in_hours || ' hours')::INTERVAL;
  END IF;

  -- Inserir notificação
  INSERT INTO public.notifications (user_id, title, message, type, expires_at)
  VALUES (target_user_id, notification_title, notification_message, notification_type, expiry_time)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- 9. Função para limpar notificações expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications 
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 10. Ativar realtime para notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;