import { supabase } from "@/integrations/supabase/client";
import bcrypt from 'bcryptjs';

export interface AuthUser {
  id: string;
  full_name: string;
  cpf: string;
  email?: string;
  role: string;
  congregation_id?: string;
  photo_url?: string;
  permissions?: any;
  terms_accepted?: boolean;
  privacy_policy_accepted?: boolean;
  two_factor_enabled?: boolean;
  first_login?: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  message?: string;
  requiresPasswordChange?: boolean;
  requiresTermsAcceptance?: boolean;
  requires2FA?: boolean;
}

export class AuthService {
  // Validar CPF
  static validateCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, "");
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
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

  // Formatar CPF
  static formatCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, "");
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  // Login com Email/Senha usando Supabase Auth e sistema customizado
  static async signInWithPassword(email: string, password: string): Promise<LoginResult> {
    try {
      console.log('🔍 Tentando login com email via Supabase Auth:', email);
      
      // Primeiro tenta o Supabase Auth oficial
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log('⚠️ Supabase Auth falhou:', error.message);
        console.log('🔄 Tentando sistema customizado...');
        
        // Se falhou no Supabase Auth, tenta o sistema customizado
        return await this.signInWithCustomAuth(email, password);
      }

      if (!data.user || !data.session) {
        console.log('❌ Dados de sessão inválidos');
        return {
          success: false,
          message: "Erro na autenticação - dados de sessão inválidos"
        };
      }

      // Buscar perfil do usuário usando maybeSingle para evitar erros
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Erro ao carregar perfil:', profileError);
        return {
          success: false,
          message: "Erro ao carregar perfil do usuário"
        };
      }

      if (!profile) {
        console.error('❌ Perfil não encontrado para usuário:', data.user.id);
        return {
          success: false,
          message: "Perfil de usuário não encontrado"
        };
      }

      console.log('✅ Login Supabase bem-sucedido:', profile.full_name);

      // Verificar se o perfil pode usar login por email
      if (!this.canUseEmailLogin(profile.role)) {
        console.log('❌ Perfil não pode usar login por email:', profile.role);
        
        // Fazer logout da sessão Supabase
        await supabase.auth.signOut();
        
        return {
          success: false,
          message: `Este perfil (${profile.role}) deve usar o login por CPF. Acesse através da opção "Portal Pessoal".`
        };
      }

      return {
        success: true,
        user: profile,
        message: `Bem-vindo(a), ${profile.full_name}!`,
        requiresPasswordChange: false,
        requiresTermsAcceptance: false,
        requires2FA: false
      };

    } catch (error: any) {
      console.error('Erro no login Supabase:', error);
      return {
        success: false,
        message: error.message || "Erro interno do servidor"
      };
    }
  }

  // Login com OTP (One-Time Password) via email
  static async signInWithOtp(email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📧 Enviando OTP para email:', email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: false // Só permite login para usuários existentes
        }
      });

      if (error) {
        console.error('❌ Erro ao enviar OTP:', error);
        return {
          success: false,
          message: error.message
        };
      }

      console.log('✅ OTP enviado com sucesso');
      return {
        success: true,
        message: "Código de acesso enviado para seu email. Verifique sua caixa de entrada."
      };

    } catch (error: any) {
      console.error('Erro ao enviar OTP:', error);
      return {
        success: false,
        message: error.message || "Erro ao enviar código de acesso"
      };
    }
  }

  // Verificar OTP token (usado quando o usuário clica no link do email)
  static async verifyOtp(token_hash: string, type: 'magiclink' | 'recovery' | 'invite' | 'email' = 'magiclink'): Promise<LoginResult> {
    try {
      console.log('🔍 Verificando OTP token');
      
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type
      });

      if (error) {
        console.error('❌ Erro na verificação OTP:', error);
        return {
          success: false,
          message: error.message
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          message: "Token inválido ou expirado"
        };
      }

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        console.error('❌ Erro ao carregar perfil:', profileError);
        return {
          success: false,
          message: "Perfil de usuário não encontrado"
        };
      }

      console.log('✅ OTP verificado com sucesso:', profile.full_name);

      return {
        success: true,
        user: profile,
        message: `Acesso autorizado! Bem-vindo(a), ${profile.full_name}!`,
        requiresPasswordChange: false,
        requiresTermsAcceptance: false,
        requires2FA: false
      };

    } catch (error: any) {
      console.error('Erro na verificação OTP:', error);
      return {
        success: false,
        message: error.message || "Erro na verificação do código"
      };
    }
  }

  // Verificar se o perfil pode usar login por CPF (aluno, membro, pastor)
  static canUseCPFLogin(role: string): boolean {
    return ['aluno', 'membro', 'pastor'].includes(role.toLowerCase());
  }

  // Verificar se o perfil pode usar login por email (diretor, professor, coordenador, secretario)
  static canUseEmailLogin(role: string): boolean {
    return ['diretor', 'professor', 'coordenador', 'secretario'].includes(role.toLowerCase());
  }

  // Login com CPF
  static async signInWithCPF(cpf: string): Promise<LoginResult> {
    try {
      if (!this.validateCPF(cpf)) {
        console.log('❌ CPF inválido:', cpf);
        return {
          success: false,
          message: "CPF inválido"
        };
      }

      const cleanCPF = cpf.replace(/\D/g, "");
      console.log('🔍 Consultando CPF:', cleanCPF);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('cpf', cleanCPF)
        .order('updated_at', { ascending: false });

      console.log('📊 Resultado da consulta:', { profiles, error });

      if (error) {
        console.error('❌ Erro na consulta:', error);
        return {
          success: false,
          message: "Erro ao consultar o banco de dados"
        };
      }

      if (!profiles || profiles.length === 0) {
        console.log('❌ CPF não encontrado:', cleanCPF);
        return {
          success: false,
          message: "CPF não encontrado no sistema"
        };
      }

      // Se há múltiplos perfis, preferir o que tem nome completo ou o mais atualizado
      let profile = profiles[0];
      if (profiles.length > 1) {
        console.log('⚠️ Múltiplos perfis encontrados, selecionando o melhor');
        profile = profiles.find(p => p.full_name && p.full_name.trim()) || profiles[0];
      }

      console.log('✅ Perfil selecionado:', profile.full_name || profile.email);

      // Verificar se o perfil pode usar login por CPF
      if (!this.canUseCPFLogin(profile.role)) {
        console.log('❌ Perfil não pode usar login por CPF:', profile.role);
        return {
          success: false,
          message: `Este perfil (${profile.role}) deve usar o login por email. Acesse através da opção "Portal de Gestão".`
        };
      }

      // Usuário autenticado com sucesso
      console.log('✅ Usuário autenticado por CPF com sucesso');
      console.log('👤 Dados do usuário:', profile);

      // Update last access (using updated_at since last_login doesn't exist)
      await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      // Tentar criar uma sessão Supabase válida para que as políticas RLS funcionem
      console.log('🔑 Tentando criar sessão Supabase para políticas RLS...');
      
      try {
        // Primeira tentativa: autenticação por email se disponível
        if (profile.email) {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: 'mudar123' // Senha padrão do sistema
          });
          
          if (!authError && authData.session) {
            console.log('✅ Sessão Supabase criada com sucesso via email');
          } else {
            console.log('⚠️ Autenticação por email falhou:', authError?.message);
            
            // Segunda tentativa: verificar se o usuário tem uma conta Supabase Auth
            try {
              await supabase.auth.signOut(); // Limpar qualquer sessão anterior
              
              // Tentar criar conta se não existe
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: profile.email,
                password: 'mudar123',
                options: {
                  data: {
                    full_name: profile.full_name,
                    cpf: profile.cpf,
                    role: profile.role
                  }
                }
              });
              
              if (!signUpError && signUpData.session) {
                console.log('✅ Conta Supabase criada e sessão estabelecida');
              } else {
                console.log('⚠️ Não foi possível criar conta Supabase:', signUpError?.message);
              }
            } catch (signUpError) {
              console.log('⚠️ Erro ao tentar criar conta Supabase');
            }
          }
        }
      } catch (authError) {
        console.log('⚠️ Erro geral na autenticação Supabase, continuando com autenticação local');
      }

      return {
        success: true,
        user: profile,
        message: `Bem-vindo(a), ${profile.full_name || 'Usuário'}!`,
        requiresPasswordChange: false,
        requiresTermsAcceptance: false,
        requires2FA: false
      };

    } catch (error: any) {
      console.error('Erro no login:', error);
      return {
        success: false,
        message: error.message || "Erro interno do servidor"
      };
    }
  }

  // Aceitar termos
  static async acceptTerms(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Since terms_accepted columns don't exist, just return success
      // Terms acceptance can be handled elsewhere if needed
      const { error } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Verificar PIN 2FA
  static async verifyTwoFactorPin(userId: string, pin: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { data, error } = await supabase.rpc('verify_two_factor_pin', {
        user_id: userId,
        pin_input: pin
      });

      if (error) throw error;

      return data as { success: boolean; message?: string };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Configurar PIN 2FA
  static async setupTwoFactorPin(userId: string, pin: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { data, error } = await supabase.rpc('set_two_factor_pin', {
        user_id: userId,
        new_pin: pin
      });

      if (error) throw error;

      return data as { success: boolean; message?: string };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Login com sistema customizado (auth_users_backup)
  static async signInWithCustomAuth(email: string, password: string): Promise<LoginResult> {
    try {
      console.log('🔍 Tentando login via sistema customizado:', email);
      console.log('🔐 Senha fornecida:', password ? `***${password.slice(-2)}` : 'VAZIA');
      
      // Usar a função do banco que já funciona corretamente
      const { data, error } = await supabase.rpc('authenticate_by_email', {
        p_email: email,
        p_password: password
      });

      if (error) {
        console.error('❌ Erro na função authenticate_by_email:', error);
        return {
          success: false,
          message: error.message || "Erro interno do sistema de autenticação"
        };
      }

      console.log('📊 Resposta da função authenticate_by_email:', data);

      // Type assertion para o resultado da função RPC
      const result = data as unknown as {
        success: boolean;
        message?: string;
        user?: AuthUser;
      };

      if (!result || !result.success) {
        console.log('❌ Função authenticate_by_email falhou:', result?.message);
        return {
          success: false,
          message: result?.message || "Credenciais inválidas"
        };
      }

      if (!result.user) {
        console.log('❌ Dados de usuário não retornados');
        return {
          success: false,
          message: "Dados do usuário não encontrados"
        };
      }

      console.log('✅ Login customizado bem-sucedido:', result.user.full_name);
      
      return {
        success: true,
        user: result.user,
        message: result.message || `Bem-vindo(a), ${result.user.full_name}!`,
        requiresPasswordChange: result.user.first_login,
        requiresTermsAcceptance: !result.user.terms_accepted || !result.user.privacy_policy_accepted,
        requires2FA: result.user.two_factor_enabled
      };

    } catch (error: any) {
      console.error('❌ Erro no sistema customizado:', error);
      return {
        success: false,
        message: error.message || "Erro interno do servidor"
      };
    }
  }

  // Função para sincronizar usuários entre sistemas
  static async syncUserToSupabaseAuth(email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Sincronizando usuário para Supabase Auth:', email);
      
      const { data, error } = await supabase.rpc('create_supabase_auth_for_profile', {
        user_email: email,
        user_password: 'Admin@2025'
      });

      if (error) {
        console.error('❌ Erro na sincronização:', error);
        return {
          success: false,
          message: error.message
        };
      }

      console.log('✅ Usuário sincronizado:', data);
      return {
        success: true,
        message: 'Usuário sincronizado com sucesso'
      };

    } catch (error: any) {
      console.error('❌ Erro na sincronização:', error);
      return {
        success: false,
        message: error.message || "Erro na sincronização"
      };
    }
  }

  // Usar a função que já existe no banco como fallback
  static async fallbackCustomAuth(email: string, password: string): Promise<LoginResult> {
    try {
      const { data, error } = await supabase.rpc('authenticate_by_email', {
        p_email: email,
        p_password: password
      });

      if (error) {
        console.error('❌ Erro na autenticação customizada:', error);
        return {
          success: false,
          message: "Email ou senha incorretos"
        };
      }

      const result = data as any;
      
      if (!result.success) {
        console.log('❌ Login customizado falhou:', result.message);
        return {
          success: false,
          message: result.message || "Email ou senha incorretos"
        };
      }

      const user = result.user;
      console.log('✅ Login customizado bem-sucedido:', user.full_name);

      // Verificar se o perfil pode usar login por email
      if (!this.canUseEmailLogin(user.role)) {
        console.log('❌ Perfil não pode usar login por email:', user.role);
        return {
          success: false,
          message: `Este perfil (${user.role}) deve usar o login por CPF. Acesse através da opção "Portal Pessoal".`
        };
      }

      // Salvar sessão local já que não temos sessão Supabase Auth
      await this.saveLocalSession(user);

      return {
        success: true,
        user: user,
        message: `Bem-vindo(a), ${user.full_name}!`,
        requiresPasswordChange: user.first_login,
        requiresTermsAcceptance: !user.terms_accepted || !user.privacy_policy_accepted,
        requires2FA: user.two_factor_enabled
      };

    } catch (error: any) {
      console.error('Erro no login customizado:', error);
      return {
        success: false,
        message: error.message || "Erro interno do servidor"
      };
    }
  }

  // Logout
  static async signOut(): Promise<void> {
    try {
      // Limpar localStorage
      localStorage.removeItem('mieadi_user_session');
      localStorage.removeItem('currentUser');
      
      // Limpar todos os dados relacionados ao auth
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Tentar logout do Supabase (pode falhar se não há sessão)
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Logout do Supabase falhou (esperado se usando CPF login)');
    }
  }

  // Salvar sessão local
  static async saveLocalSession(user: AuthUser): Promise<void> {
    const sessionData = {
      ...user,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
    };
    
    localStorage.setItem('mieadi_user_session', JSON.stringify(sessionData));
    
    // Salvar dados para o contexto de autenticação PRIMEIRO
    const currentUserData = {
      id: user.id,
      cpf: user.cpf,
      role: user.role,
      full_name: user.full_name,
      email: user.email
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUserData));
    
    // Usuário autenticado com sucesso via email
    console.log('✅ Usuário autenticado por email com sucesso');
    console.log('👤 Dados do usuário:', user);
    
    // Testar contexto RLS
    try {
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
        
      if (testError) {
        console.log('⚠️ Teste de contexto falhou:', testError.message);
      } else {
        console.log('✅ Contexto RLS funcionando corretamente');
      }
      
    } catch (contextError) {
      console.log('⚠️ Falha ao estabelecer contexto (não crítico)');
    }
  }

  // Carregar sessão local
  static loadLocalSession(): AuthUser | null {
    try {
      const localSession = localStorage.getItem('mieadi_user_session');
      
      if (!localSession) return null;

      const userData = JSON.parse(localSession);
      const sessionExpiry = userData.expiresAt || 0;
      
      if (Date.now() >= sessionExpiry) {
        localStorage.removeItem('mieadi_user_session');
        return null;
      }

      return userData;
    } catch (error) {
      localStorage.removeItem('mieadi_user_session');
      return null;
    }
  }

  // Limpar sessão local
  static clearLocalSession(): void {
    localStorage.removeItem('mieadi_user_session');
  }
}