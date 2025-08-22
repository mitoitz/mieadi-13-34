
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from '@supabase/supabase-js';

export type UserType = "diretor" | "aluno" | "pastor" | "professor" | "coordenador" | "secretario" | "membro";

export interface User {
  id: string;
  name: string;
  full_name: string;
  email: string;
  cpf?: string;
  userType: UserType;
  role: UserType;
  congregacao?: string;
  congregation_id?: string;
  permissions?: any;
  session?: Session;
  photo_url?: string;
  tela_permitida?: string;
  can_edit?: boolean;
  two_factor_enabled?: boolean;
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se há sessão armazenada localmente
    const storedUser = localStorage.getItem('mieadi_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('🔄 Restaurando sessão do usuário:', userData);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
        localStorage.removeItem('mieadi_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = async (profile: any) => {
    try {
      console.log('🚀 Executando handleLogin com perfil:', profile);
      setError(null);
      
      const userData: User = {
        id: profile.id,
        name: profile.full_name || profile.name || "Usuário",
        full_name: profile.full_name || profile.name || "Usuário",
        email: profile.email || '',
        cpf: profile.cpf || '',
        userType: profile.role || profile.userType,
        role: profile.role || profile.userType,
        congregacao: profile.congregacao || profile.congregation_id,
        congregation_id: profile.congregation_id,
        permissions: profile.permissions,
        session: profile.session,
        photo_url: profile.photo_url,
        tela_permitida: profile.tela_permitida,
        can_edit: profile.can_edit,
        two_factor_enabled: profile.two_factor_enabled
      };
      
      console.log('👤 Dados do usuário preparados:', userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Armazenar sessão no localStorage
      localStorage.setItem('mieadi_user', JSON.stringify(userData));
      
      console.log('✅ Login completo!');
    } catch (error) {
      console.error('❌ Erro no login:', error);
      setError('Erro no login');
    }
  };

  const handleLogout = async () => {
    try {
      setError(null);
      
      // Remover dados do localStorage
      localStorage.removeItem('mieadi_user');
      
      setUser(null);
      setIsAuthenticated(false);
      setSession(null);
      
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setError('Erro ao fazer logout');
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return false;

    try {
      setError(null);
      
      // Mapear propriedades do User para colunas do banco
      const dbUpdates: any = {};
      
      if (updates.name || updates.full_name) dbUpdates.full_name = updates.name || updates.full_name;
      if (updates.cpf) dbUpdates.cpf = updates.cpf;
      if (updates.userType) dbUpdates.role = updates.userType;
      if (updates.congregacao) dbUpdates.congregation_id = updates.congregacao;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.photo_url) dbUpdates.photo_url = updates.photo_url;
      
      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        setError('Erro ao atualizar perfil');
        return false;
      }

      setUser({ ...user, ...updates });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setError('Erro ao atualizar perfil');
      return false;
    }
  };

  const clearError = () => setError(null);

  return {
    isAuthenticated,
    user,
    session,
    loading,
    error,
    handleLogin,
    handleLogout,
    updateProfile,
    clearError
  };
};
