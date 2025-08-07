import { supabase } from "@/integrations/supabase/client";
import type { CreateMasterAdminData, CreateMasterAdminResult } from "./types";

export class MasterAdminService {
  async createMasterAdmin(adminData: CreateMasterAdminData): Promise<CreateMasterAdminResult> {
    try {
      // Gerar senha se não fornecida
      const password = adminData.password || this.generateRandomPassword();

      // Usar o signup normal do Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: password,
        options: {
          data: {
            full_name: adminData.name
          }
        }
      });

      if (authError) {
        return { success: false, message: `Erro ao criar usuário: ${authError.message}` };
      }

      if (!authData.user) {
        return { success: false, message: 'Erro: Usuário não criado' };
      }

      // Criar perfil na tabela profiles com role admin
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          full_name: adminData.name,
          email: adminData.email,
          cpf: adminData.cpf,
          role: 'admin',
          status: 'ativo'
        }]);

      if (profileError) {
        return { success: false, message: `Erro ao criar perfil: ${profileError.message}` };
      }

      return {
        success: true,
        message: `Diretor master ${adminData.name} criado com sucesso! Verifique o email para confirmar a conta.`,
        password: password
      };
    } catch (error: any) {
      return { success: false, message: `Erro inesperado: ${error.message}` };
    }
  }

  private generateRandomPassword(): string {
    const length = 16; // Aumentar tamanho para maior segurança
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let password = "";
    
    // Garantir pelo menos um de cada tipo
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Preencher o resto
    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}