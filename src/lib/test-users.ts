import { supabase } from "@/integrations/supabase/client";

export interface TestUser {
  name: string;
  email: string;
  cpf: string;
  password: string;
  role: 'admin' | 'coordenador' | 'professor' | 'aluno' | 'membro';
}

export const createTestUsers = async (): Promise<TestUser[]> => {
  const testUsers: TestUser[] = [
    {
      name: "Admin Teste",
      email: "admin@teste.com",
      cpf: "111.111.111-11",
      password: "admin123456",
      role: "admin"
    },
    {
      name: "Coordenador Teste", 
      email: "coordenador@teste.com",
      cpf: "222.222.222-22",
      password: "coord123456",
      role: "coordenador"
    },
    {
      name: "Professor Teste",
      email: "professor@teste.com", 
      cpf: "333.333.333-33",
      password: "prof123456",
      role: "professor"
    },
    {
      name: "Aluno Teste",
      email: "aluno@teste.com",
      cpf: "444.444.444-44", 
      password: "aluno123456",
      role: "aluno"
    },
    {
      name: "Membro Teste",
      email: "membro@teste.com",
      cpf: "555.555.555-55",
      password: "membro123456", 
      role: "membro"
    }
  ];

  const results: TestUser[] = [];

  for (const user of testUsers) {
    try {
      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.name
          }
        }
      });

      if (authError) {
        console.error(`Erro ao criar usuário ${user.name}:`, authError.message);
        continue;
      }

      if (!authData.user) {
        console.error(`Usuário ${user.name} não foi criado`);
        continue;
      }

      // Criar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          full_name: user.name,
          email: user.email,
          cpf: user.cpf,
          role: user.role,
          status: 'ativo'
        }]);

      if (profileError) {
        console.error(`Erro ao criar perfil para ${user.name}:`, profileError.message);
        continue;
      }

      results.push(user);
      console.log(`✅ Usuário ${user.name} criado com sucesso!`);
      
    } catch (error: any) {
      console.error(`Erro inesperado ao criar ${user.name}:`, error.message);
    }
  }

  return results;
};

// Para usar no console do navegador
export const runTestUserCreation = async () => {
  console.log("🚀 Iniciando criação de usuários de teste...");
  const users = await createTestUsers();
  
  console.log("\n📋 CREDENCIAIS DOS USUÁRIOS DE TESTE:");
  console.log("=====================================");
  
  users.forEach(user => {
    console.log(`\n${user.role.toUpperCase()}:`);
    console.log(`Email: ${user.email}`);
    console.log(`CPF: ${user.cpf}`);
    console.log(`Senha: ${user.password}`);
  });
  
  return users;
};

// Disponibilizar globalmente para teste
if (typeof window !== 'undefined') {
  (window as any).createTestUsers = runTestUserCreation;
}