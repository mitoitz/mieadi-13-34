import { supabase } from "@/integrations/supabase/client";

function generateSecurePassword(): string {
  const length = 16;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

function generateRandomCPF(): string {
  // Gerar 9 primeiros dígitos
  const firstNine = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  
  // Calcular primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += firstNine[i] * (10 - i);
  }
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  // Calcular segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += firstNine[i] * (11 - i);
  }
  sum += firstDigit * 2;
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  return [...firstNine, firstDigit, secondDigit].join('');
}

export async function createAdminUser() {
  try {
    // Gerar senha segura aleatória
    const securePassword = generateSecurePassword();
    
    // Verificar se o usuário admin já existe na autenticação
    const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(
      '00000000-0000-0000-0000-000000000001'
    );

    if (!getUserError && authUser.user) {
      console.log('Admin user already exists in auth');
      return { success: true, message: 'Usuário admin já existe no sistema de autenticação' };
    }

    // Criar usuário admin no sistema de autenticação
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'master@sistema.com',
      password: securePassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Usuário Master',
        cpf: generateRandomCPF(),
        role: 'admin'
      }
    });

    if (error) {
      throw error;
    }

    // Atualizar o perfil com o ID correto do usuário criado
    if (data.user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ id: data.user.id })
        .eq('id', data.user.id);

      if (updateError) {
        console.error('Error updating profile with auth user ID:', updateError);
      }
    }

    return { 
      success: true, 
      message: 'Usuário admin criado com sucesso',
      user: data.user 
    };

  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return { 
      success: false, 
      message: error.message || 'Erro ao criar usuário admin' 
    };
  }
}