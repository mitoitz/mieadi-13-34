-- RPCs para upsert direto com deduplicação e mapeamento

-- 1) Upsert de evento por fingerprint, com opção de mapear legacy_event_id
CREATE OR REPLACE FUNCTION public.upsert_event_by_fingerprint(
  p_title text,
  p_start timestamptz,
  p_end timestamptz,
  p_location text DEFAULT NULL,
  p_class_id uuid DEFAULT NULL,
  p_event_type text DEFAULT 'aula',
  p_status text DEFAULT 'agendado',
  p_created_by uuid DEFAULT NULL,
  p_legacy_event_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_event_id uuid;
  v_user_id uuid := COALESCE(auth.uid(), get_current_authenticated_user());
  v_is_allowed boolean := false;
BEGIN
  -- Permitir apenas admins/coordenadores/secretários/professores
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id AND role IN ('diretor','admin','coordenador','secretario','professor')
  ) INTO v_is_allowed;

  IF NOT v_is_allowed THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Tentar localizar evento por fingerprint (titulo normalizado + data + class_id + local)
  SELECT e.id INTO v_event_id
  FROM events e
  WHERE normalize_identifier_text(e.title) = normalize_identifier_text(p_title)
    AND (date(e.start_datetime AT TIME ZONE 'UTC')) = (date(p_start AT TIME ZONE 'UTC'))
    AND (e.class_id IS NOT DISTINCT FROM p_class_id)
    AND normalize_identifier_text(coalesce(e.location, '')) = normalize_identifier_text(coalesce(p_location, ''))
  LIMIT 1;

  -- Se não existe, criar
  IF v_event_id IS NULL THEN
    INSERT INTO events (
      title, description, start_datetime, end_datetime, location, class_id, event_type, status, created_by
    ) VALUES (
      p_title, NULL, p_start, p_end, p_location, p_class_id, COALESCE(p_event_type,'aula'), COALESCE(p_status,'agendado'), COALESCE(p_created_by, v_user_id)
    ) RETURNING id INTO v_event_id;
  END IF;

  -- Se veio legacy_event_id, registrar no mapa
  IF p_legacy_event_id IS NOT NULL AND p_legacy_event_id <> '' THEN
    INSERT INTO legacy_event_map (legacy_event_id, canonical_event_id, matched_via)
    VALUES (p_legacy_event_id, v_event_id, 'rpc_upsert')
    ON CONFLICT (legacy_event_id) DO UPDATE SET canonical_event_id = EXCLUDED.canonical_event_id, matched_via = 'rpc_upsert';
  END IF;

  RETURN v_event_id;
END;
$$;

-- 2) Insert de frequência remapeando evento por legacy_event_id ou fingerprint
CREATE OR REPLACE FUNCTION public.insert_attendance_by_legacy_or_fingerprint(
  p_student_id uuid,
  p_status text DEFAULT 'presente',
  p_verification_method text DEFAULT 'manual',
  p_check_in_time timestamptz DEFAULT now(),
  p_check_out_time timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_event_id uuid DEFAULT NULL,
  p_legacy_event_id text DEFAULT NULL,
  p_title text DEFAULT NULL,
  p_start timestamptz DEFAULT NULL,
  p_end timestamptz DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_class_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid := COALESCE(auth.uid(), get_current_authenticated_user());
  v_is_allowed boolean := false;
  v_event_id uuid;
  v_attendance_id uuid;
BEGIN
  -- Permitir apenas admins/coordenadores/secretários/professores
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id AND role IN ('diretor','admin','coordenador','secretario','professor')
  ) INTO v_is_allowed;

  IF NOT v_is_allowed THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Determinar event_id canônico
  IF p_event_id IS NOT NULL THEN
    v_event_id := p_event_id;
  ELSIF p_legacy_event_id IS NOT NULL AND p_legacy_event_id <> '' THEN
    SELECT canonical_event_id INTO v_event_id FROM legacy_event_map WHERE legacy_event_id = p_legacy_event_id;
    -- Se não existir map ainda, tentar criar/achar pelo fingerprint (requer titulo e start)
    IF v_event_id IS NULL THEN
      IF p_title IS NULL OR p_start IS NULL OR p_end IS NULL THEN
        RAISE EXCEPTION 'Missing event fingerprint fields (title/start/end) to resolve legacy_event_id %', p_legacy_event_id;
      END IF;
      v_event_id := upsert_event_by_fingerprint(p_title, p_start, p_end, p_location, p_class_id, 'aula', 'agendado', v_user_id, p_legacy_event_id);
    END IF;
  ELSE
    -- Sem legacy nem event_id: usar fingerprint direto (título + datas obrigatórios)
    IF p_title IS NULL OR p_start IS NULL OR p_end IS NULL THEN
      RAISE EXCEPTION 'Either event_id/legacy_event_id or title+start+end must be provided';
    END IF;
    v_event_id := upsert_event_by_fingerprint(p_title, p_start, p_end, p_location, p_class_id, 'aula', 'agendado', v_user_id, NULL);
  END IF;

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Unable to determine canonical event_id';
  END IF;

  -- Se já existe registro igual, retornar existente
  SELECT id INTO v_attendance_id FROM attendance_records ar
  WHERE ar.student_id = p_student_id
    AND ar.event_id = v_event_id
    AND coalesce(ar.check_in_time, 'epoch'::timestamptz) = coalesce(p_check_in_time, 'epoch'::timestamptz)
    AND coalesce(ar.status, '') = coalesce(p_status, '')
  LIMIT 1;

  IF v_attendance_id IS NOT NULL THEN
    RETURN v_attendance_id;
  END IF;

  -- Inserir nova frequência
  INSERT INTO attendance_records (
    event_id, student_id, status, verification_method, check_in_time, check_out_time, notes, attendance_type
  ) VALUES (
    v_event_id, p_student_id, COALESCE(p_status,'presente'), COALESCE(p_verification_method,'manual'), p_check_in_time, p_check_out_time, p_notes, 'presenca'
  ) RETURNING id INTO v_attendance_id;

  RETURN v_attendance_id;
END;
$$;