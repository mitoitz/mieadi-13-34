-- Função para inserir frequências em lote com segurança, contornando RLS
-- Cria RPC que aceita um array JSON de registros
-- Cada registro deve conter: student_id (uuid), class_id (uuid, opcional), session_id (uuid, opcional), date (date), status (text), notes (text opcional)

-- Set up: create function with SECURITY DEFINER and limited access
create or replace function public.bulk_insert_attendances(
  records jsonb
)
returns table (
  id uuid,
  student_id uuid,
  class_id uuid,
  session_id uuid,
  date date,
  status text,
  notes text
) as $$
DECLARE
  _has_permission boolean;
BEGIN
  -- Verifica se o usuário atual tem perfil com role diretor/admin
  -- Se a tabela profiles não permitir leitura pública, ajuste as policies conforme necessário
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('diretor','admin')
  ) INTO _has_permission;

  IF COALESCE(_has_permission, false) = false THEN
    RAISE EXCEPTION 'Permission denied: only diretor/admin can import attendances' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH data AS (
    SELECT * FROM jsonb_to_recordset(records) AS x(
      student_id uuid,
      class_id uuid,
      session_id uuid,
      date date,
      status text,
      notes text
    )
  )
  INSERT INTO public.attendances (student_id, class_id, session_id, date, status, notes)
  SELECT d.student_id, d.class_id, d.session_id, d.date, d.status, d.notes
  FROM data d
  RETURNING attendances.id, attendances.student_id, attendances.class_id, attendances.session_id, attendances.date, attendances.status, attendances.notes;
END;
$$ language plpgsql security definer set search_path = public, extensions;

-- Permissões: permitir execução por usuários autenticados
revoke all on function public.bulk_insert_attendances(jsonb) from public;
grant execute on function public.bulk_insert_attendances(jsonb) to authenticated;
