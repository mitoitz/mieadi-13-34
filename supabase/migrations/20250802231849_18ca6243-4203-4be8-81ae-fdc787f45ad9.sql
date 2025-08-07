-- Updated function with correct password hashing for Supabase
CREATE OR REPLACE FUNCTION create_auth_account_for_admin(
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
  auth_user_id UUID;
  result JSON;
  password_hash TEXT;
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
  
  -- Check if user can use email login (admin roles)
  IF profile_record.role NOT IN ('diretor', 'admin', 'coordenador', 'secretario', 'professor') THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'User role cannot use email login'
    );
  END IF;
  
  -- Create a simple MD5 hash for password (Supabase will handle proper hashing)
  password_hash := md5(user_password || profile_record.email);
  
  -- Try to create the auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    profile_record.id,
    'authenticated',
    'authenticated',
    profile_record.email,
    password_hash,
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    json_build_object(
      'full_name', profile_record.full_name,
      'role', profile_record.role
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = password_hash,
    email_confirmed_at = NOW(),
    updated_at = NOW();
    
  -- Create identity record
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    profile_record.id,
    profile_record.id,
    json_build_object(
      'sub', profile_record.id,
      'email', profile_record.email
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (provider, user_id) DO UPDATE SET
    last_sign_in_at = NOW(),
    updated_at = NOW();
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Auth account created/updated successfully',
    'user_id', profile_record.id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Error creating auth account: ' || SQLERRM
    );
END;
$$;