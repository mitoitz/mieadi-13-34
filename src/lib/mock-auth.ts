// Sistema de autenticação mock sem verificação de banco de dados

export type UserType = "admin" | "aluno" | "pastor" | "professor" | "coordenador" | "secretario" | "membro";

export interface MockUser {
  id: string;
  name: string;
  cpf: string;
  userType: UserType;
  congregacao?: string;
}

// Usuários pré-definidos para teste rápido
const mockUsers: Record<UserType, MockUser> = {
  admin: {
    id: "admin-1",
    name: "Diretor Sistema",
    cpf: "111.111.111-11",
    userType: "admin"
  },
  coordenador: {
    id: "coord-1", 
    name: "Coordenador Teste",
    cpf: "222.222.222-22",
    userType: "coordenador",
    congregacao: "Igreja Central"
  },
  professor: {
    id: "prof-1",
    name: "Professor Teste", 
    cpf: "333.333.333-33",
    userType: "professor",
    congregacao: "Igreja Central"
  },
  pastor: {
    id: "pastor-1",
    name: "Pastor Teste",
    cpf: "444.444.444-44", 
    userType: "pastor",
    congregacao: "Igreja Central"
  },
  secretario: {
    id: "sec-1",
    name: "Secretário Teste",
    cpf: "555.555.555-55",
    userType: "secretario", 
    congregacao: "Igreja Central"
  },
  aluno: {
    id: "aluno-1",
    name: "Aluno Teste",
    cpf: "666.666.666-66",
    userType: "aluno",
    congregacao: "Igreja Central"
  },
  membro: {
    id: "membro-1", 
    name: "Membro Teste",
    cpf: "777.777.777-77",
    userType: "membro",
    congregacao: "Igreja Central"
  }
};

// Simula login apenas com seleção de tipo de usuário
export function mockLogin(userType: UserType): MockUser {
  return mockUsers[userType];
}

// Simula login com CPF personalizado
export function mockLoginWithCPF(cpf: string, userType: UserType): MockUser {
  const baseUser = mockUsers[userType];
  return {
    ...baseUser,
    cpf: cpf,
    name: `${baseUser.name} (${cpf})`
  };
}

// Valida formato básico do CPF (apenas formato, não matemática)
export function validateCPFFormat(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");
  return cleanCPF.length === 11;
}

// Formata CPF para display
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}