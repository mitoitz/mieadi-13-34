-- Atualizar senha do usuário FERNANDO BRITO SANTANA para "mudar123"
UPDATE auth_users_backup 
SET encrypted_password = 'mudar123'
WHERE email = 'FERNANDOBRITOSANTANA@GMAIL.COM';