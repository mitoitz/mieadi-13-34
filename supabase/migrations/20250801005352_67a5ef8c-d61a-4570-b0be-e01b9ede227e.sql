-- Add foreign key constraints to subjects table
ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;

ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_professor_id_fkey 
FOREIGN KEY (professor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;