-- First, create missing student profiles
INSERT INTO public.profiles (id, full_name, email, role, status, created_at, updated_at) VALUES 
('bb9d20d2-56b7-489b-9703-63db756667c5', 'Aluno Demo 1', 'aluno1@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('88b216db-a83e-4ebf-91db-e50f4456d9e4', 'Aluno Demo 2', 'aluno2@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('6507f225-43c7-43ea-8f45-0b29d3f48404', 'Aluno Demo 3', 'aluno3@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('65307dc3-68fd-403d-a31e-1c9a47e4d1f2', 'Aluno Demo 4', 'aluno4@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('0e29ffec-ce1a-498d-a69e-426e76d093f5', 'Aluno Demo 5', 'aluno5@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('8e78e3ed-698e-4ef1-b9ce-65e0e9765bc7', 'Aluno Demo 6', 'aluno6@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('4362fc02-bdc2-4329-b175-5f1458b794c5', 'Aluno Demo 7', 'aluno7@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('c9340466-3e14-428d-a585-758b323a45fe', 'Aluno Demo 8', 'aluno8@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('8a55ee6b-4e82-466e-9a8b-0843e7ee9721', 'Aluno Demo 9', 'aluno9@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('bc8afa79-edb3-4b3e-8f09-dd51eeff67fc', 'Aluno Demo 10', 'aluno10@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('1fa0e4b5-ae6a-42d4-8ece-b504e818825d', 'Aluno Demo 11', 'aluno11@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('fbbca666-aec6-4fde-9f7e-ebec4516ad69', 'Aluno Demo 12', 'aluno12@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('7afa3e2b-1f92-4c8b-9267-96a5c0d0fd38', 'Aluno Demo 13', 'aluno13@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('86eb3a59-9a88-47e6-bd3e-7ec4d8f834c5', 'Aluno Demo 14', 'aluno14@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('7419e71d-2c5a-438a-9bc1-ebc07470e92f', 'Aluno Demo 15', 'aluno15@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('ea897ead-5a52-46c9-bd3e-c368b5942eda', 'Aluno Demo 16', 'aluno16@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('ac2e38a8-1590-4115-8b4c-e8f46eaeb2aa', 'Aluno Demo 17', 'aluno17@demo.com', 'aluno', 'ativo', NOW(), NOW()),
('9afcfa96-e80a-4fab-b416-d723054aab93', 'Aluno Demo 18', 'aluno18@demo.com', 'aluno', 'ativo', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Then insert the attendance records
INSERT INTO public.attendances (id, student_id, class_id, session_id, date, status, notes) VALUES 
('213f95ee-54ff-4a5f-b3dc-2a074baebd89', 'bb9d20d2-56b7-489b-9703-63db756667c5', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', '7c167b35-b216-41f3-b4c1-2454f61aa499', '2023-08-07', 'ausente', NULL),
('5db55165-47e0-4249-bb93-12482ec5ffda', '88b216db-a83e-4ebf-91db-e50f4456d9e4', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', 'df29487e-d03d-45d7-b58d-ffb98d0a9c4c', '2023-08-07', 'ausente', NULL),
('dc7a5b0c-bc96-4ef2-bae5-666122dbd0af', '6507f225-43c7-43ea-8f45-0b29d3f48404', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', '426a8269-2f9a-4441-b5cb-fcb3763172fe', '2023-08-07', 'ausente', NULL),
('0d91e7c9-20bd-454e-8fc6-23aff8df600c', '65307dc3-68fd-403d-a31e-1c9a47e4d1f2', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', 'a22b9240-c70f-464a-97d0-f3ca590ac2a4', '2023-08-07', 'ausente', NULL),
('1a1f6fa0-c0d7-495e-b719-640b6744c71f', '0e29ffec-ce1a-498d-a69e-426e76d093f5', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', '3c59ba59-f0af-4ea7-a634-024816906e39', '2023-08-07', 'ausente', NULL),
('82b1eec1-59d0-4ca9-936d-d35125cb18d6', '8e78e3ed-698e-4ef1-b9ce-65e0e9765bc7', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', '649d5d09-657e-451c-8260-6cd234c064c3', '2023-08-07', 'ausente', NULL),
('360fc796-ad4f-4a09-9a72-e755e4dbe46e', '4362fc02-bdc2-4329-b175-5f1458b794c5', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', 'd2900e0e-b58f-47a9-bfee-5d05d813bfd2', '2023-08-07', 'ausente', NULL),
('2031a9d9-4ca4-41c2-a6ba-b3bc899cf09f', 'c9340466-3e14-428d-a585-758b323a45fe', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', '054e7ef7-ae55-4255-9506-b1b249920020', '2023-08-07', 'ausente', NULL),
('18be8a1d-b6fb-4129-8b07-2ffcb2826407', '8a55ee6b-4e82-466e-9a8b-0843e7ee9721', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', 'ee4ec97d-38cc-4e2b-85ba-290ede0d1893', '2023-08-07', 'ausente', NULL),
('b626481a-3b9a-42a5-bff4-0045e1c1668e', 'bc8afa79-edb3-4b3e-8f09-dd51eeff67fc', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', 'eaf7e4f7-f51e-4153-9135-9f35c2ff3a14', '2023-08-07', 'ausente', NULL),
('65694466-7513-4c64-9ad4-ce59bc6116a2', '1fa0e4b5-ae6a-42d4-8ece-b504e818825d', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', 'ac8c64ee-0884-4b43-aa18-518e5c6d11b7', '2023-08-07', 'ausente', NULL),
('c3875145-6433-40bb-86e4-ac6837938778', 'fbbca666-aec6-4fde-9f7e-ebec4516ad69', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', '592711fb-1e8a-47bf-b3c2-89c6a3349cf6', '2023-08-07', 'ausente', NULL),
('e499807f-c22a-49f6-8905-1d0cb2c40265', '7afa3e2b-1f92-4c8b-9267-96a5c0d0fd38', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', '6eeddc72-c6d2-496a-af82-a84670fba223', '2023-08-07', 'ausente', NULL),
('eb2faa46-ca47-47b2-b40c-5d4e02dead0e', '86eb3a59-9a88-47e6-bd3e-7ec4d8f834c5', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', 'be3f544c-790a-4d46-bcf1-46b58d491c29', '2023-08-07', 'ausente', NULL),
('026faa48-361f-4058-b780-baed32e40f42', '7419e71d-2c5a-438a-9bc1-ebc07470e92f', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', 'cd2ba256-09db-4dfe-afe7-1c5296ea5dad', '2023-08-07', 'ausente', NULL),
('2e20627e-041c-4296-90ab-929ecd03d722', 'ea897ead-5a52-46c9-bd3e-c368b5942eda', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', '5db5e149-a1da-4eec-afb3-292f21d8ebe3', '2023-08-07', 'ausente', NULL),
('c3d43ae6-d066-4be7-92ea-14b1b4421313', 'ac2e38a8-1590-4115-8b4c-e8f46eaeb2aa', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', 'a17368f1-ce75-4902-9f3c-3017b7b57b50', '2023-08-07', 'ausente', NULL),
('23887aec-6b32-4b83-831f-0c027bca4afa', '9afcfa96-e80a-4fab-b416-d723054aab93', 'cc9b4c37-1e49-4fda-ab23-8e5be0ff8e52', '2d2fd4e4-6271-44fd-9d92-339f15e36267', '2023-08-07', 'ausente', NULL);