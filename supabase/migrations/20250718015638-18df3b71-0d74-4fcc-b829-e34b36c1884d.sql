-- Migração para adicionar tabelas em falta (evitando duplicatas)

-- 1. Verificar e criar tabela member_indications se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'member_indications') THEN
    CREATE TABLE public.member_indications (
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
    
    -- RLS para member_indications
    ALTER TABLE public.member_indications ENABLE ROW LEVEL SECURITY;
    
    -- Índices
    CREATE INDEX idx_member_indications_indicating_member ON public.member_indications(indicating_member_id);
    CREATE INDEX idx_member_indications_congregation ON public.member_indications(congregation_id);
    
    -- Trigger para updated_at
    CREATE TRIGGER update_member_indications_updated_at
      BEFORE UPDATE ON public.member_indications
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 2. Verificar e criar tabela notifications se não existir  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
    CREATE TABLE public.notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
      read BOOLEAN DEFAULT false,
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- RLS para notifications
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    
    -- Índices
    CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
    CREATE INDEX idx_notifications_read ON public.notifications(read);
    
    -- Ativar realtime
    ALTER TABLE public.notifications REPLICA IDENTITY FULL;
  END IF;
END $$;

-- 3. Adicionar colunas em class_materials se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'class_materials' AND column_name = 'teacher_id') THEN
    ALTER TABLE public.class_materials ADD COLUMN teacher_id UUID REFERENCES public.profiles(id);
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'class_materials' AND column_name = 'material_type') THEN
    ALTER TABLE public.class_materials ADD COLUMN material_type TEXT DEFAULT 'document';
  END IF;
END $$;

-- 4. Criar ou substituir políticas para notifications (evitando duplicatas)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

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

-- 5. Criar ou substituir políticas para member_indications
DROP POLICY IF EXISTS "Users can view their own indications" ON public.member_indications;
DROP POLICY IF EXISTS "Users can create indications" ON public.member_indications;
DROP POLICY IF EXISTS "Admins can manage all indications" ON public.member_indications;

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