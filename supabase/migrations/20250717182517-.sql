-- Create classes table first
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  professor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  schedule TEXT,
  capacity INTEGER,
  description TEXT,
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'concluida')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for classes
CREATE POLICY "Users can view classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Admins and coordinators can manage classes" ON public.classes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordenador')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();