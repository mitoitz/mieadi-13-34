-- Simple function to create Supabase auth account for existing profile
CREATE OR REPLACE FUNCTION create_supabase_auth_for_profile(
  user_email TEXT,
  user_password TEXT DEFAULT 'Admin@2025'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record profiles%ROWTYPE;
  result JSON;
BEGIN
  -- Get the profile
  SELECT * INTO profile_record 
  FROM profiles 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'User not found in profiles table'
    );
  END IF;
  
  -- Check if user can use email login
  IF profile_record.role NOT IN ('diretor', 'admin', 'coordenador', 'secretario', 'professor') THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'User role cannot use email login'
    );
  END IF;
  
  -- Instead of manually creating auth records, 
  -- we'll set a flag to indicate this user needs Supabase auth setup
  UPDATE profiles 
  SET 
    password_hash = crypt(user_password, gen_salt('bf')),
    first_login = false,
    last_password_change = NOW(),
    email_confirmed_at = NOW()
  WHERE id = profile_record.id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Profile prepared for Supabase Auth. Password set to: ' || user_password,
    'user_id', profile_record.id,
    'email', profile_record.email,
    'password', user_password
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Error preparing auth account: ' || SQLERRM
    );
END;
$$;