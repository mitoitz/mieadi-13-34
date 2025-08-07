-- Update RLS policies for profiles table to allow proper insertion and updates

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- Create more permissive policies for profile management
CREATE POLICY "Users can insert their own profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (true);

-- Create RLS policies for storage bucket access
CREATE POLICY "Anyone can upload to person-photos bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'person-photos');

CREATE POLICY "Anyone can view person-photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'person-photos');

CREATE POLICY "Anyone can update person-photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'person-photos');

CREATE POLICY "Anyone can delete person-photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'person-photos');