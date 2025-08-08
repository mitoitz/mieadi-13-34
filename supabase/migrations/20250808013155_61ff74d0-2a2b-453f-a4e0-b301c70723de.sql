-- Fix infinite recursion in profiles RLS by removing self-referential subqueries
-- 1) Create helper function to check director or secretary without querying profiles recursively in policy evaluation context
CREATE OR REPLACE FUNCTION public.is_director_or_secretary()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(auth.uid(), get_current_authenticated_user())
      AND role IN ('diretor', 'secretario')
  );
$$;

-- 2) Replace the recursive SELECT policy with a non-recursive check
DROP POLICY IF EXISTS "Admins can search users for PIN reset" ON public.profiles;

CREATE POLICY "Admins can search users for PIN reset"
ON public.profiles
FOR SELECT
USING (public.is_director_or_secretary());
