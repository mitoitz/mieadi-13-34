import { supabase } from "@/integrations/supabase/client";
import bcrypt from 'bcryptjs';

// Função para criar dados iniciais do sistema
export const setupInitialData = async () => {
  console.log('🚀 Iniciando configuração de dados iniciais...');
  
  try {
    // 1. Verificar e criar congregações básicas
    await createInitialCongregations();
    
    // 2. Verificar e criar campos ministeriais básicos
    await createInitialFields();
    
    // 3. Verificar e criar cursos básicos
    await createInitialCourses();
    
    // 4. Verificar e criar disciplinas básicas
    await createInitialSubjects();
    
    // 5. Verificar e criar usuário admin se não existir
    await createAdminUser();
    
    console.log('✅ Configuração de dados iniciais concluída!');
    
  } catch (error) {
    console.error('❌ Erro na configuração inicial:', error);
    throw error;
  }
};

// Criar congregações iniciais
const createInitialCongregations = async () => {
  const { data: existing } = await supabase
    .from('congregations')
    .select('id')
    .limit(1);
    
  if (existing && existing.length > 0) {
    console.log('✓ Congregações já existem');
    return;
  }
  
  const congregations = [
    {
      name: "Igreja Central",
      address: "Rua Principal, 123",
      city: "São Paulo",
      state: "SP",
      postal_code: "01000-000",
      phone: "(11) 99999-9999",
      email: "central@mieadi.com.br",
      pastor_name: "Pastor Principal"
    },
    {
      name: "Igreja Vila Nova",
      address: "Av. Nova, 456", 
      city: "São Paulo",
      state: "SP",
      postal_code: "02000-000",
      phone: "(11) 88888-8888",
      email: "vilanova@mieadi.com.br",
      pastor_name: "Pastor Auxiliar"
    }
  ];
  
  const { error } = await supabase
    .from('congregations')
    .insert(congregations);
    
  if (error) throw error;
  console.log('✅ Congregações criadas');
};

// Criar campos ministeriais
const createInitialFields = async () => {
  const { data: existing } = await supabase
    .from('fields')
    .select('id')
    .limit(1);
    
  if (existing && existing.length > 0) {
    console.log('✓ Campos ministeriais já existem');
    return;
  }
  
  const fields = [
    {
      name: "Ministério de Ensino",
      description: "Responsável pela educação teológica e acadêmica"
    },
    {
      name: "Ministério de Evangelismo", 
      description: "Responsável pela evangelização e missões"
    },
    {
      name: "Ministério de Louvor",
      description: "Responsável pela música e adoração"
    },
    {
      name: "Ministério de Assistência Social",
      description: "Responsável pela ação social e comunitária"
    }
  ];
  
  const { error } = await supabase
    .from('fields')
    .insert(fields);
    
  if (error) throw error;
  console.log('✅ Campos ministeriais criados');
};

// Criar cursos básicos
const createInitialCourses = async () => {
  const { data: existing } = await supabase
    .from('courses')
    .select('id')
    .limit(1);
    
  if (existing && existing.length > 0) {
    console.log('✓ Cursos já existem');
    return;
  }
  
  const courses = [
    {
      name: "Teologia Básica",
      description: "Curso introdutório de teologia para novos membros",
      duration_months: 12,
      total_credits: 60
    },
    {
      name: "Teologia Intermediária",
      description: "Curso intermediário de teologia",
      duration_months: 18,
      total_credits: 90
    },
    {
      name: "Bacharel em Teologia",
      description: "Curso superior de teologia", 
      duration_months: 36,
      total_credits: 180
    },
    {
      name: "Ministério Pastoral",
      description: "Formação específica para pastores",
      duration_months: 24,
      total_credits: 120
    }
  ];
  
  const { error } = await supabase
    .from('courses')
    .insert(courses);
    
  if (error) throw error;
  console.log('✅ Cursos criados');
};

// Criar disciplinas básicas
const createInitialSubjects = async () => {
  const { data: existing } = await supabase
    .from('subjects')
    .select('id')
    .limit(1);
    
  if (existing && existing.length > 0) {
    console.log('✓ Disciplinas já existem');
    return;
  }
  
  const subjects = [
    {
      name: "Bíblia Sagrada I",
      description: "Introdução ao estudo das Sagradas Escrituras",
      credits: 4,
      workload_hours: 60
    },
    {
      name: "Bíblia Sagrada II", 
      description: "Aprofundamento no estudo bíblico",
      credits: 4,
      workload_hours: 60
    },
    {
      name: "Teologia Sistemática I",
      description: "Fundamentos da teologia sistemática",
      credits: 6,
      workload_hours: 90
    },
    {
      name: "História da Igreja",
      description: "História do cristianismo através dos séculos",
      credits: 4,
      workload_hours: 60
    },
    {
      name: "Homilética",
      description: "Arte da pregação e comunicação cristã",
      credits: 4,
      workload_hours: 60
    },
    {
      name: "Grego Bíblico",
      description: "Estudo do grego do Novo Testamento",
      credits: 6,
      workload_hours: 90
    },
    {
      name: "Hebraico Bíblico",
      description: "Estudo do hebraico do Antigo Testamento", 
      credits: 6,
      workload_hours: 90
    },
    {
      name: "Ética Cristã",
      description: "Princípios éticos na perspectiva cristã",
      credits: 4,
      workload_hours: 60
    }
  ];
  
  const { error } = await supabase
    .from('subjects')
    .insert(subjects);
    
  if (error) throw error;
  console.log('✅ Disciplinas criadas');
};

// Criar usuário admin se não existir
const createAdminUser = async () => {
  const { data: adminExists } = await supabase
    .from('profiles')
    .select('id')
    .eq('cpf', '00000000001')
    .maybeSingle();
    
  if (adminExists) {
    console.log('✓ Usuário admin já existe');
    return;
  }
  
  // Criar senha hash
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const adminUser = {
    id: '00000000-0000-0000-0000-000000000002',
    full_name: 'Diretor Sistema',
    email: 'admin@mieadi.com.br',
    cpf: '00000000001',
    role: 'admin' as const,
    status: 'ativo' as const,
    first_login: false,
    terms_accepted: true,
    privacy_policy_accepted: true
  };
  
  const { error } = await supabase
    .from('profiles')
    .insert([adminUser]);
    
  if (error) throw error;
  console.log('✅ Usuário admin criado (CPF: 000.000.000-01, Senha: admin123)');
};

// Função para executar setup completo
export const runCompleteSetup = async () => {
  try {
    await setupInitialData();
    return {
      success: true,
      message: 'Sistema configurado com sucesso!',
      credentials: {
        cpf: '000.000.000-01',
        password: 'admin123'
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Erro na configuração: ${error.message}`
    };
  }
};

// Disponibilizar globalmente para teste
if (typeof window !== 'undefined') {
  (window as any).setupMieadiSystem = runCompleteSetup;
}