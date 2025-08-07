import { supabase } from '@/integrations/supabase/client';

/**
 * Define o contexto do usuário autenticado para operações no banco de dados
 * Essa função é necessária quando o usuário está autenticado via CPF local
 * ao invés de autenticação nativa do Supabase
 */
export async function setUserContext(): Promise<boolean> {
  try {
    // Verificar se há uma sessão ativa do Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log('✅ Usuário autenticado via Supabase:', session.user.id);
      return true;
    }

    // Se não há sessão Supabase, verificar autenticação local
    const mieadiUser = JSON.parse(localStorage.getItem('mieadi_user') || '{}');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    const user = mieadiUser.id ? mieadiUser : currentUser;
    
    if (user.id && user.role) {
      console.log('🔐 Contexto do usuário local encontrado:', user.id, 'Role:', user.role);
      return true;
    }

    console.warn('⚠️ Nenhuma autenticação encontrada');
    return false;
  } catch (error) {
    console.error('❌ Erro ao definir contexto do usuário:', error);
    return false;
  }
}

/**
 * Verifica se o usuário atual tem permissões administrativas
 */
export function isAdminUser(): boolean {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return ['diretor', 'coordenador', 'secretario'].includes(currentUser.role);
  } catch {
    return false;
  }
}

/**
 * Executa uma operação no banco definindo o contexto do usuário antes
 */
export async function executeWithUserContext<T>(
  operation: () => Promise<T>,
  operationName: string = 'operação'
): Promise<T> {
  console.log(`🔄 Executando ${operationName} com contexto do usuário...`);
  
  try {
    // Garantir que o contexto está estabelecido antes da operação
    const contextSet = await setUserContext();
    
    if (!contextSet) {
      console.warn(`⚠️ Não foi possível estabelecer contexto para ${operationName}, mas continuando...`);
    }
    
    const result = await operation();
    console.log(`✅ ${operationName} concluída com sucesso`);
    
    // Log authentication activity for security monitoring
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.cpf && operationName !== 'operação') {
        await supabase.rpc('log_authentication_event', {
          p_user_id: currentUser.id,
          p_event_type: 'operation_executed',
          p_success: true,
          p_additional_data: { operation: operationName }
        });
      }
    } catch (logError) {
      console.warn('Failed to log authentication event:', logError);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Erro na ${operationName}:`, error);
    
    // Log failed operations for security monitoring
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.cpf) {
        await supabase.rpc('log_authentication_event', {
          p_user_id: currentUser.id,
          p_event_type: 'operation_failed',
          p_success: false,
          p_additional_data: { operation: operationName, error: error.message }
        });
      }
    } catch (logError) {
      console.warn('Failed to log authentication event:', logError);
    }
    
    throw error;
  }
}