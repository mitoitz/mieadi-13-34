-- Staging e deduplicação de dados legados (eventos, presenças e disciplinas)
-- Observa: usa funções SECURITY DEFINER para contornar RLS somente durante a consolidação

-- 1) Tabelas de STAGING
CREATE TABLE IF NOT EXISTS public.legacy_events_staging (
  legacy_event_id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  location text,
  class_id uuid,
  event_type text DEFAULT 'aula',
  status text DEFAULT 'agendado',
  created_by uuid,
  inserted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legacy_attendance_staging (
  legacy_attendance_id text PRIMARY KEY,
  legacy_event_id text NOT NULL,
  student_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'presente',
  verification_method text DEFAULT 'manual',
  check_in_time timestamptz,
  check_out_time timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legacy_event_map (
  legacy_event_id text PRIMARY KEY,
  canonical_event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  matched_via text,
  created_at timestamptz DEFAULT now()
);

-- Disciplinas (subjects) staging e mapa
CREATE TABLE IF NOT EXISTS public.legacy_subjects_staging (
  legacy_subject_id text PRIMARY KEY,
  name text NOT NULL,
  code text,
  description text,
  credits integer,
  course_id uuid,
  professor_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legacy_subject_map (
  legacy_subject_id text PRIMARY KEY,
  canonical_subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  matched_via text,
  created_at timestamptz DEFAULT now()
);

-- 2) RLS para as tabelas de staging (permitir apenas admins/coordenadores/secretários)
ALTER TABLE public.legacy_events_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_attendance_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_event_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_subjects_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_subject_map ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'legacy_events_staging' AND policyname = 'Admins can manage legacy_events_staging'
  ) THEN
    CREATE POLICY "Admins can manage legacy_events_staging" ON public.legacy_events_staging
    FOR ALL TO authenticated
    USING (is_admin_or_coordinator() OR is_secretary())
    WITH CHECK (is_admin_or_coordinator() OR is_secretary());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'legacy_attendance_staging' AND policyname = 'Admins can manage legacy_attendance_staging'
  ) THEN
    CREATE POLICY "Admins can manage legacy_attendance_staging" ON public.legacy_attendance_staging
    FOR ALL TO authenticated
    USING (is_admin_or_coordinator() OR is_secretary())
    WITH CHECK (is_admin_or_coordinator() OR is_secretary());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'legacy_event_map' AND policyname = 'Admins can read legacy_event_map'
  ) THEN
    CREATE POLICY "Admins can read legacy_event_map" ON public.legacy_event_map
    FOR SELECT TO authenticated
    USING (is_admin_or_coordinator() OR is_secretary());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'legacy_subjects_staging' AND policyname = 'Admins can manage legacy_subjects_staging'
  ) THEN
    CREATE POLICY "Admins can manage legacy_subjects_staging" ON public.legacy_subjects_staging
    FOR ALL TO authenticated
    USING (is_admin_or_coordinator() OR is_secretary())
    WITH CHECK (is_admin_or_coordinator() OR is_secretary());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'legacy_subject_map' AND policyname = 'Admins can read legacy_subject_map'
  ) THEN
    CREATE POLICY "Admins can read legacy_subject_map" ON public.legacy_subject_map
    FOR SELECT TO authenticated
    USING (is_admin_or_coordinator() OR is_secretary());
  END IF;
END $$;

-- 3) Funções utilitárias de normalização
CREATE OR REPLACE FUNCTION public.normalize_identifier_text(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(coalesce(p_text, ''), '[^a-z0-9]+', '', 'gi'));
$$;

CREATE OR REPLACE FUNCTION public.event_fingerprint(p_title text, p_start timestamptz, p_class_id uuid, p_location text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 
    normalize_identifier_text(p_title) || '|' ||
    to_char(timezone('UTC', coalesce(p_start, now())), 'YYYY-MM-DD') || '|' ||
    coalesce(p_class_id::text, '-') || '|' ||
    normalize_identifier_text(p_location);
$$;

-- 4) Consolidação de EVENTOS e PRESENÇAS
CREATE OR REPLACE FUNCTION public.consolidate_legacy_events()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  ev RECORD;
  atd RECORD;
  v_event_id uuid;
  v_inserted_events integer := 0;
  v_mapped_events integer := 0;
  v_inserted_att integer := 0;
  v_skipped_att integer := 0;
BEGIN
  -- Mapear/Inserir eventos
  FOR ev IN SELECT * FROM legacy_events_staging LOOP
    -- Tentar localizar evento existente com mesma "impressão digital"
    SELECT e.id INTO v_event_id
    FROM events e
    WHERE normalize_identifier_text(e.title) = normalize_identifier_text(ev.title)
      AND (date(e.start_datetime AT TIME ZONE 'UTC')) = (date(ev.start_datetime AT TIME ZONE 'UTC'))
      AND (e.class_id IS NOT DISTINCT FROM ev.class_id)
      AND normalize_identifier_text(coalesce(e.location, '')) = normalize_identifier_text(coalesce(ev.location, ''))
    LIMIT 1;

    IF v_event_id IS NULL THEN
      INSERT INTO events (
        title, description, start_datetime, end_datetime, location, class_id, event_type, status, created_by
      ) VALUES (
        ev.title, ev.description, ev.start_datetime, ev.end_datetime, ev.location, ev.class_id, coalesce(ev.event_type, 'aula'), coalesce(ev.status, 'agendado'), ev.created_by
      ) RETURNING id INTO v_event_id;
      v_inserted_events := v_inserted_events + 1;
      INSERT INTO legacy_event_map (legacy_event_id, canonical_event_id, matched_via)
      VALUES (ev.legacy_event_id, v_event_id, 'inserted')
      ON CONFLICT (legacy_event_id) DO UPDATE SET canonical_event_id = EXCLUDED.canonical_event_id, matched_via = 'reconciled';
    ELSE
      v_mapped_events := v_mapped_events + 1;
      INSERT INTO legacy_event_map (legacy_event_id, canonical_event_id, matched_via)
      VALUES (ev.legacy_event_id, v_event_id, 'matched')
      ON CONFLICT (legacy_event_id) DO UPDATE SET canonical_event_id = EXCLUDED.canonical_event_id, matched_via = 'matched';
    END IF;
  END LOOP;

  -- Inserir presenças remapeadas
  FOR atd IN SELECT * FROM legacy_attendance_staging LOOP
    SELECT canonical_event_id INTO v_event_id FROM legacy_event_map WHERE legacy_event_id = atd.legacy_event_id;
    IF v_event_id IS NULL THEN
      CONTINUE; -- sem evento canônico
    END IF;

    IF EXISTS (
      SELECT 1 FROM attendance_records ar
      WHERE ar.student_id = atd.student_id
        AND ar.event_id = v_event_id
        AND coalesce(ar.check_in_time, 'epoch'::timestamptz) = coalesce(atd.check_in_time, 'epoch'::timestamptz)
        AND coalesce(ar.status, '') = coalesce(atd.status, '')
    ) THEN
      v_skipped_att := v_skipped_att + 1;
    ELSE
      INSERT INTO attendance_records (
        event_id, student_id, status, verification_method, check_in_time, check_out_time, notes, attendance_type
      ) VALUES (
        v_event_id, atd.student_id, coalesce(atd.status, 'presente'), coalesce(atd.verification_method, 'manual'), atd.check_in_time, atd.check_out_time, atd.notes, 'presenca'
      );
      v_inserted_att := v_inserted_att + 1;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'inserted_events', v_inserted_events,
    'matched_events', v_mapped_events,
    'inserted_attendances', v_inserted_att,
    'skipped_attendances', v_skipped_att
  );
END;
$$;

-- 5) Consolidação de DISCIPLINAS (subjects)
CREATE OR REPLACE FUNCTION public.consolidate_legacy_subjects()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  sb RECORD;
  v_subject_id uuid;
  v_inserted integer := 0;
  v_matched integer := 0;
BEGIN
  FOR sb IN SELECT * FROM legacy_subjects_staging LOOP
    -- Critério: por code (se houver), senão por nome normalizado + course_id
    IF sb.code IS NOT NULL AND sb.code <> '' THEN
      SELECT id INTO v_subject_id FROM subjects WHERE lower(code) = lower(sb.code) LIMIT 1;
    END IF;

    IF v_subject_id IS NULL THEN
      SELECT id INTO v_subject_id FROM subjects
      WHERE normalize_identifier_text(name) = normalize_identifier_text(sb.name)
        AND (course_id IS NOT DISTINCT FROM sb.course_id)
      LIMIT 1;
    END IF;

    IF v_subject_id IS NULL THEN
      INSERT INTO subjects (name, code, description, credits, course_id, professor_id)
      VALUES (sb.name, NULLIF(sb.code, ''), sb.description, sb.credits, sb.course_id, sb.professor_id)
      RETURNING id INTO v_subject_id;
      v_inserted := v_inserted + 1;
      INSERT INTO legacy_subject_map (legacy_subject_id, canonical_subject_id, matched_via)
      VALUES (sb.legacy_subject_id, v_subject_id, 'inserted')
      ON CONFLICT (legacy_subject_id) DO UPDATE SET canonical_subject_id = EXCLUDED.canonical_subject_id, matched_via = 'reconciled';
    ELSE
      v_matched := v_matched + 1;
      INSERT INTO legacy_subject_map (legacy_subject_id, canonical_subject_id, matched_via)
      VALUES (sb.legacy_subject_id, v_subject_id, 'matched')
      ON CONFLICT (legacy_subject_id) DO UPDATE SET canonical_subject_id = EXCLUDED.canonical_subject_id, matched_via = 'matched';
    END IF;
  END LOOP;

  RETURN json_build_object(
    'inserted_subjects', v_inserted,
    'matched_subjects', v_matched
  );
END;
$$;

-- 6) Consolidador único (opcional): roda ambas as rotinas e retorna resumo
CREATE OR REPLACE FUNCTION public.consolidate_legacy_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  ev_res json;
  sb_res json;
BEGIN
  ev_res := public.consolidate_legacy_events();
  sb_res := public.consolidate_legacy_subjects();
  RETURN json_build_object('events', ev_res, 'subjects', sb_res);
END;
$$;

-- Indexes auxiliares (expressões) para acelerar matching (não únicos)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_events_normtitle_date_class_loc'
  ) THEN
    CREATE INDEX idx_events_normtitle_date_class_loc ON public.events (
      (public.normalize_identifier_text(title)),
      (date(start_datetime AT TIME ZONE 'UTC')),
      class_id,
      (public.normalize_identifier_text(coalesce(location, '')))
    );
  END IF;
END $$;
