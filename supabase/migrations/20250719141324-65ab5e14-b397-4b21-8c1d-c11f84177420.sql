-- Adicionar valores faltantes ao enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pastor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretario';