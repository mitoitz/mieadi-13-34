-- Corrigir políticas RLS para biometric_data para permitir inserção pelo sistema
DROP POLICY IF EXISTS "System can insert biometric data" ON public.biometric_data;
DROP POLICY IF EXISTS "System can update biometric data" ON public.biometric_data;

-- Política para permitir inserção através da edge function
CREATE POLICY "System can insert biometric data" 
ON public.biometric_data 
FOR INSERT 
WITH CHECK (true);

-- Política para permitir atualização através da edge function
CREATE POLICY "System can update biometric data" 
ON public.biometric_data 
FOR UPDATE 
USING (true) 
WITH CHECK (true);