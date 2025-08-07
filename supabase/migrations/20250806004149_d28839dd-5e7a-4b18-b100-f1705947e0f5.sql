-- Removendo dados e estruturas relacionadas à biometria
-- Verificando se existem colunas relacionadas à biometria em tabelas

-- Remover qualquer dado ou coluna relacionada a biometria na tabela attendance_records
ALTER TABLE public.attendance_records 
DROP COLUMN IF EXISTS facial_data,
DROP COLUMN IF EXISTS fingerprint_data,
DROP COLUMN IF EXISTS biometric_data;

-- Remover qualquer dado ou coluna relacionada a biometria na tabela profiles
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS facial_image_url,
DROP COLUMN IF EXISTS fingerprint_data,
DROP COLUMN IF EXISTS biometric_enrolled,
DROP COLUMN IF EXISTS face_encoding;

-- Limpar métodos de verificação biométrica
UPDATE public.attendance_records 
SET verification_method = 'manual' 
WHERE verification_method IN ('facial', 'fingerprint', 'biometric');

-- Comentário: Removidas todas as estruturas de dados relacionadas à biometria
-- incluindo colunas para dados faciais, digitais e qualquer informação biométrica