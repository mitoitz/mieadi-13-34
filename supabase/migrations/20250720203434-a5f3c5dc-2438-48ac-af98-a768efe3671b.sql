-- Corrigir as políticas RLS para a tabela courses
-- Permitir DELETE explicitamente para administradores

-- Primeiro, remover a política genérica existente
DROP POLICY IF EXISTS "Allow all operations on courses" ON public.courses;

-- Criar políticas específicas mais seguras
CREATE POLICY "Anyone can view courses" 
ON public.courses 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can create courses" 
ON public.courses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador')
  )
);

CREATE POLICY "Admins can update courses" 
ON public.courses 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador')
  )
);

CREATE POLICY "Admins can delete courses" 
ON public.courses 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador')
  )
);