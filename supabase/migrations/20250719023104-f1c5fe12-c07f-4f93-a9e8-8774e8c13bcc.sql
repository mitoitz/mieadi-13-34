-- Check current constraints on profiles table
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
AND contype = 'c';

-- Drop the gender constraint entirely since it's causing issues
ALTER TABLE public.profiles DROP CONSTRAINT profiles_gender_check;