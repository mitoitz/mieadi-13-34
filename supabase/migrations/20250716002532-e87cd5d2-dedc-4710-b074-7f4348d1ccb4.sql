-- Criar tabela para gerenciar turmas/classes mais detalhadamente
CREATE TABLE IF NOT EXISTS public.class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=domingo, 1=segunda, etc
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para mensalidades/pagamentos mais estruturada
CREATE TABLE IF NOT EXISTS public.tuition_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_date DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para controle de presença mais detalhado
CREATE TABLE IF NOT EXISTS public.class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_time TIME,
  topic TEXT,
  description TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Melhorar tabela de frequência para referenciar sessões
ALTER TABLE public.attendances 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.class_sessions(id) ON DELETE CASCADE;

-- Criar tabela para notificações do sistema
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_class_schedules_class_id ON public.class_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day_time ON public.class_schedules(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_tuition_fees_student ON public.tuition_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_tuition_fees_due_date ON public.tuition_fees(due_date);
CREATE INDEX IF NOT EXISTS idx_tuition_fees_status ON public.tuition_fees(status);
CREATE INDEX IF NOT EXISTS idx_class_sessions_class_date ON public.class_sessions(class_id, session_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tuition_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para class_schedules
CREATE POLICY "Users can view schedules for their classes" ON public.class_schedules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.class_id = class_schedules.class_id 
    AND enrollments.student_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE classes.id = class_schedules.class_id 
    AND classes.professor_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador')
  )
);

CREATE POLICY "Admins and professors can manage schedules" ON public.class_schedules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE classes.id = class_schedules.class_id 
    AND classes.professor_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador')
  )
);

-- Políticas RLS para tuition_fees
CREATE POLICY "Students can view their own fees" ON public.tuition_fees
FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all fees" ON public.tuition_fees
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador')
  )
);

-- Políticas RLS para class_sessions
CREATE POLICY "Users can view sessions for their classes" ON public.class_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.class_id = class_sessions.class_id 
    AND enrollments.student_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE classes.id = class_sessions.class_id 
    AND classes.professor_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador')
  )
);

CREATE POLICY "Admins and professors can manage sessions" ON public.class_sessions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE classes.id = class_sessions.class_id 
    AND classes.professor_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador')
  )
);

-- Políticas RLS para notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON public.notifications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador')
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_class_schedules_updated_at
  BEFORE UPDATE ON public.class_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tuition_fees_updated_at
  BEFORE UPDATE ON public.tuition_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_sessions_updated_at
  BEFORE UPDATE ON public.class_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();