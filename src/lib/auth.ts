import { supabase } from "@/integrations/supabase/client";
import bcrypt from 'bcryptjs';

type UserRole = "admin" | "pastor" | "coordenador" | "secretario" | "professor" | "aluno" | "membro";

// CPF validation function
export function validateCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, "");
  
  // Check if it has 11 digits
  if (cleanCPF.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

// Format CPF for display
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Password validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Deve ter pelo menos 8 caracteres");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Deve conter pelo menos uma letra maiúscula");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Deve conter pelo menos uma letra minúscula");
  }
  
  if (!/\d/.test(password)) {
    errors.push("Deve conter pelo menos um número");
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Deve conter pelo menos um caractere especial");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Sign in with CPF and password
export async function signInWithCPF(cpf: string, password: string) {
  try {
    // First validate CPF format
    if (!validateCPF(cpf)) {
      throw new Error("CPF inválido");
    }

    // Clean CPF (remove formatting) before database query
    const cleanCPF = cpf.replace(/\D/g, "");

    // Check rate limiting
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_identifier: cleanCPF,
        p_action_type: 'login',
        p_max_attempts: 5,
        p_window_minutes: 15
      });

    if (rateLimitError || !rateLimitCheck) {
      await supabase.rpc('log_authentication_event', {
        p_user_id: null,
        p_event_type: 'rate_limit_exceeded',
        p_success: false,
        p_additional_data: { cpf: cleanCPF }
      });
      throw new Error("Muitas tentativas de login. Tente novamente em 15 minutos.");
    }

    // Get user profile by CPF
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('cpf', cleanCPF)
      .single();

    if (profileError || !profile) {
      await supabase.rpc('log_authentication_event', {
        p_user_id: null,
        p_event_type: 'login_attempt_invalid_cpf',
        p_success: false,
        p_additional_data: { cpf: cleanCPF }
      });
      throw new Error("CPF não encontrado no sistema");
    }

    // Use PIN verification instead since password_hash doesn't exist
    const { data: pinResult, error: pinError } = await supabase.rpc('verify_user_pin', {
      cpf_input: cleanCPF,
      pin_input: password
    });

    if (pinError || !(pinResult as any)?.success) {
      await supabase.rpc('log_authentication_event', {
        p_user_id: profile.id,
        p_event_type: 'login_attempt_invalid_pin',
        p_success: false,
        p_additional_data: { cpf: cleanCPF }
      });
      throw new Error("PIN incorreto");
    }

    // Log successful login
    await supabase.rpc('log_authentication_event', {
      p_user_id: profile.id,
      p_event_type: 'login_success',
      p_success: true,
      p_additional_data: { 
        cpf: cleanCPF,
        role: profile.role
      }
    });

    return {
      profile,
      requiresPasswordChange: false,
      message: `Bem-vindo(a), ${profile.full_name}!`
    };
  } catch (error: any) {
    console.error('❌ Erro no login:', error);
    throw error;
  }
}

// Change PIN for user
export async function changePassword(userId: string, newPin: string) {
  try {
    // Validate PIN (should be 4 digits)
    if (!/^\d{4}$/.test(newPin)) {
      throw new Error("PIN deve conter exatamente 4 números");
    }

    const { data, error } = await supabase.rpc('setup_user_pin', {
      user_id: userId,
      pin_code: newPin
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    throw error;
  }
}

// Reset password function
export async function resetPassword(cpf: string) {
  try {
    console.log('🔄 Iniciando reset de senha para CPF:', cpf);
    
    if (!validateCPF(cpf)) {
      console.log('❌ CPF inválido:', cpf);
      throw new Error("CPF inválido");
    }

    // Limpar CPF (remover formatação)
    const cleanCPF = cpf.replace(/\D/g, "");
    console.log('🧹 CPF limpo:', cleanCPF);

    const { data, error } = await supabase.rpc('reset_user_password', { user_cpf: cleanCPF });
    
    console.log('📡 Resposta da função reset_user_password:', { data, error });
    
    if (error) {
      console.error('❌ Erro na função reset_user_password:', error);
      throw error;
    }

    if (!data) {
      console.log('❌ CPF não encontrado no sistema:', cleanCPF);
      throw new Error("CPF não encontrado no sistema");
    }

    console.log('✅ Reset de senha bem-sucedido!');
    return { success: true, message: "Senha resetada para senha temporária segura. O usuário precisará alterar no próximo login." };
  } catch (error: any) {
    console.error('❌ Erro no reset de senha:', error);
    throw error;
  }
}

// Sign up new user (for member registration)
export async function signUpUser(
  email: string,
  password: string,
  userData: {
    full_name: string;
    cpf: string;
    phone?: string;
    role: UserRole;
  }
) {
  try {
    // Validate CPF
    if (!validateCPF(userData.cpf)) {
      throw new Error("CPF inválido");
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(`Senha inválida: ${passwordValidation.errors.join(", ")}`);
    }

    // Check if CPF already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('cpf')
      .eq('cpf', userData.cpf)
      .single();

    if (existingProfile) {
      throw new Error("CPF já cadastrado no sistema");
    }

    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: userData.full_name,
          cpf: userData.cpf,
          phone: userData.phone,
          role: userData.role,
        }
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    throw error;
  }
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

// Get current user session
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Get current user profile
export async function getCurrentUserProfile() {
  const session = await getCurrentSession();
  if (!session?.user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return profile;
}