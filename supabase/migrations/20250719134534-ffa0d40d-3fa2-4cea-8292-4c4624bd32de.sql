-- Import fields and courses
INSERT INTO public.fields (id, name, description, responsible_id) VALUES
  ('660f9511-f3ac-52e5-b827-557766551111', 'Campo Urbano', 'Área metropolitana da cidade', NULL),
  ('660f9511-f3ac-52e5-b827-557766551112', 'Campo Rural', 'Zona rural e interior', NULL),
  ('660f9511-f3ac-52e5-b827-557766551113', 'Campo Missionário', 'Área de missões e evangelismo', NULL);

INSERT INTO public.courses (id, name, description, duration_months, total_credits) VALUES
  ('770fa622-04bd-63f6-c938-668877662222', 'Teologia Básica', 'Curso básico de formação teológica', 24, 120),
  ('770fa622-04bd-63f6-c938-668877662223', 'Liderança Cristã', 'Formação de líderes cristãos', 18, 90),
  ('770fa622-04bd-63f6-c938-668877662224', 'Missões e Evangelismo', 'Preparação para trabalho missionário', 12, 60);