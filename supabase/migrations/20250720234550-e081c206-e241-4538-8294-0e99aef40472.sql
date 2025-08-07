-- Drop the existing foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_course_id_fkey;

-- Add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_course_id_fkey 
FOREIGN KEY (course_id) 
REFERENCES public.courses(id) 
ON DELETE SET NULL;