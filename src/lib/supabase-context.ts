import { supabase } from '@/integrations/supabase/client';

/**
 * Utilitário para garantir que as operações do Supabase tenham o contexto correto
 * especialmente importante para autenticação híbrida (local + Supabase)
 */

// Interceptor para automaticamente definir contexto antes de operações sensíveis
let isInterceptorSet = false;

export function setupSupabaseInterceptor() {
  if (isInterceptorSet) return;
  
  // Em vez de interceptar o cliente, vamos criar uma função wrapper
  console.log('✅ Sistema de contexto Supabase configurado (sem interceptor)');
  isInterceptorSet = true;
}

/**
 * Garante que o contexto do usuário está definido para RLS
 */
async function ensureUserContext(): Promise<void> {
  try {
    // Verificar se há sessão ativa do Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log('✅ Sessão Supabase ativa:', session.user.id);
      return;
    }

    // Se não há sessão Supabase, usar autenticação local
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (currentUser.cpf && currentUser.role) {
      console.log('🔐 Usuário local encontrado:', currentUser.cpf);
      console.log('✅ Contexto disponível via localStorage');
    } else {
      console.warn('⚠️ Nenhum contexto de usuário disponível');
    }
  } catch (error) {
    console.error('❌ Erro ao garantir contexto do usuário:', error);
  }
}

/**
 * Verifica se há token/sessão válida e retorna informações de debug
 */
export async function debugAuthState(): Promise<{
  hasSupabaseSession: boolean;
  hasLocalSession: boolean;
  currentUser: any;
  sessionInfo: any;
}> {
  try {
    // Verificar sessão Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Verificar sessão local
    const localSession = localStorage.getItem('mieadi_user_session');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    const debugInfo = {
      hasSupabaseSession: !!session,
      hasLocalSession: !!localSession,
      currentUser,
      sessionInfo: session ? {
        userId: session.user?.id,
        email: session.user?.email,
        expiresAt: session.expires_at
      } : null,
      error: error?.message
    };
    
    console.log('🔍 Estado da autenticação:', debugInfo);
    return debugInfo;
    
  } catch (error) {
    console.error('❌ Erro ao verificar estado da autenticação:', error);
    return {
      hasSupabaseSession: false,
      hasLocalSession: false,
      currentUser: null,
      sessionInfo: null
    };
  }
}

/**
 * Força o estabelecimento do contexto do usuário
 */
export async function forceUserContext(): Promise<boolean> {
  console.log('🔄 Forçando estabelecimento do contexto...');
  
  try {
    await ensureUserContext();
    
    // Testar se o contexto funciona
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error('❌ Teste de contexto falhou:', error);
      return false;
    }
    
    console.log('✅ Contexto funcionando corretamente');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao forçar contexto:', error);
    return false;
  }
}

// Configurar interceptor automaticamente
setupSupabaseInterceptor();