import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthUser {
  id: string;
  full_name: string;
  cpf: string;
  role: string;
  tela_permitida: string;
  has_pin: boolean;
  can_edit: boolean;
  photo_url?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

interface PinSetupResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const useCPFAuth = () => {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const { toast } = useToast();

  const authenticateByCPF = async (cpf: string): Promise<AuthResponse> => {
    setLoading(true);
    console.log('🔄 Iniciando authenticateByCPF:', { cpf });
    
    try {
      const { data, error } = await supabase
        .rpc('authenticate_by_cpf', { cpf_input: cpf });

      console.log('📊 Resultado authenticate_by_cpf:', { data, error });

      if (error) {
        console.error('❌ Erro na autenticação por CPF:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro interno do servidor",
          variant: "destructive",
        });
        return { success: false, message: "Erro interno do servidor" };
      }

      const result = data as unknown as AuthResponse;
      console.log('📋 Resultado final:', result);
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
        toast({
          title: "CPF encontrado",
          description: `Usuário: ${result.user.full_name}`,
        });
      } else {
        toast({
          title: "CPF não encontrado",
          description: result.message || "Verifique se o CPF está correto",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Erro na autenticação por CPF:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
      return { success: false, message: "Erro de conexão" };
    } finally {
      setLoading(false);
    }
  };

  const setupPIN = async (userCpf: string, pin: string): Promise<boolean> => {
    setLoading(true);
    console.log('🔄 Iniciando setupPIN:', { cpf: userCpf, pin });
    
    try {
      console.log('🔄 Chamando set_user_pin RPC...');
      const { data, error } = await supabase
        .rpc('set_user_pin', { input_cpf: userCpf, new_pin: pin });

      console.log('📊 Resultado set_user_pin:', { data, error });

      if (error) {
        console.error('❌ Erro ao configurar PIN:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao configurar PIN",
          variant: "destructive",
        });
        return false;
      }

      // A função RPC retorna um JSON, então fazemos type assertion
      const result = data as unknown as PinSetupResponse;
      if (result?.success) {
        toast({
          title: "Sucesso", 
          description: result.message || "PIN configurado com sucesso!",
        });
        return true;
      } else {
        toast({
          title: "Erro",
          description: result?.error || "Erro ao configurar PIN",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao configurar PIN:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyPIN = async (userCpf: string, pin: string): Promise<AuthResponse> => {
    setLoading(true);
    console.log('🔄 Iniciando verifyPIN:', { cpf: userCpf, pin });
    
    try {
      // Limpar CPF antes de enviar
      const cleanCpf = userCpf.replace(/[^0-9]/g, '');
      console.log('🔄 CPF limpo:', cleanCpf);
      
      console.log('🔄 Chamando verify_user_pin RPC...');
      const { data, error } = await supabase
        .rpc('verify_user_pin', { cpf_input: cleanCpf, pin_input: pin });

      console.log('📊 Resultado verify_user_pin:', { data, error });

      if (error) {
        console.error('❌ Erro na verificação do PIN:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro interno do servidor",
          variant: "destructive",
        });
        return { success: false, message: "Erro interno do servidor" };
      }

      // Verificar se data existe e tem o formato esperado
      if (!data) {
        console.error('❌ Dados vazios retornados da RPC');
        toast({
          title: "Erro",
          description: "Resposta inválida do servidor",
          variant: "destructive",
        });
        return { success: false, message: "Resposta inválida do servidor" };
      }

      // A função RPC retorna um JSON, então fazemos type assertion
      const result = data as unknown as AuthResponse;
      console.log('📋 Resultado processado:', result);
      
      if (result?.success && result.user) {
        setCurrentUser(result.user);
        toast({
          title: "Sucesso",
          description: `Bem-vindo(a), ${result.user.full_name}!`,
        });
      } else {
        toast({
          title: "Erro",
          description: result?.message || "PIN incorreto",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Erro na verificação do PIN:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
      return { success: false, message: "Erro de conexão" };
    } finally {
      setLoading(false);
    }
  };

  const searchUserByCPF = async (cpf: string): Promise<AuthUser | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('authenticate_by_cpf', { cpf_input: cpf });

      const result = data as unknown as AuthResponse;
      if (error || !result?.success) {
        return null;
      }

      return result.user || null;
    } catch (error) {
      console.error('Erro na busca por CPF:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetUserPIN = async (userCpf: string, newPin: string): Promise<boolean> => {
    return setupPIN(userCpf, newPin);
  };

  return {
    loading,
    currentUser,
    authenticateByCPF,
    setupPIN,
    verifyPIN,
    searchUserByCPF,
    resetUserPIN,
    setCurrentUser
  };
};