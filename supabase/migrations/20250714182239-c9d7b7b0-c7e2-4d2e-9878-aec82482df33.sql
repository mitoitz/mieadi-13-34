-- Adicionar novos campos à tabela profiles para melhorar o cadastro de pessoas
ALTER TABLE public.profiles 
ADD COLUMN ministerial_position TEXT,
ADD COLUMN spouse_name TEXT,
ADD COLUMN photo_url TEXT,
ADD COLUMN is_student BOOLEAN DEFAULT false,
ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Criar bucket para fotos de pessoas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('person-photos', 'person-photos', true);

-- Criar políticas para o bucket de fotos
CREATE POLICY "Qualquer pessoa pode ver fotos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'person-photos');

CREATE POLICY "Usuários autenticados podem fazer upload de fotos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'person-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar fotos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'person-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar fotos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'person-photos' AND auth.uid() IS NOT NULL);