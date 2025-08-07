-- Import subjects with unique codes
INSERT INTO public.subjects (id, name, description, code, credits, course_id, professor_id) VALUES
  ('881fb733-15ce-4407-9049-779988773333', 'Teologia Sistemática', 'Estudo das doutrinas cristãs fundamentais', 'TS101', 6, '770fa622-04bd-63f6-c938-668877662222', NULL),
  ('881fb733-15ce-4407-9049-779988773334', 'Hermenêutica Bíblica', 'Princípios de interpretação das Escrituras', 'HB102', 4, '770fa622-04bd-63f6-c938-668877662222', NULL),
  ('881fb733-15ce-4407-9049-779988773335', 'Homilética', 'Arte e ciência da pregação', 'HM103', 4, '770fa622-04bd-63f6-c938-668877662223', NULL);