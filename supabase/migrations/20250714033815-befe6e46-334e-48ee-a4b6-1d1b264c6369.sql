-- Add cpf column to member_requests table
ALTER TABLE public.member_requests 
ADD COLUMN cpf text;

-- Add index for better performance on CPF searches
CREATE INDEX idx_member_requests_cpf ON public.member_requests(cpf);