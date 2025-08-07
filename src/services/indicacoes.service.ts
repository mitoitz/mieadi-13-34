import { supabase } from "@/integrations/supabase/client";

export interface MemberIndication {
  id: string;
  member_id: string;
  course_id: string;
  indicated_by: string;
  justification: string;
  priority: 'alta' | 'normal' | 'baixa';
  status: 'pendente' | 'aprovada' | 'rejeitada';
  created_at: string;
  updated_at: string;
  member?: {
    id: string;
    full_name: string;
    email: string;
  };
  course?: {
    id: string;
    name: string;
  };
}

export interface CreateIndicationData {
  member_id: string;
  course_id: string;
  indicated_by: string;
  justification: string;
  priority: 'alta' | 'normal' | 'baixa';
}

export const indicacoesService = {
  async createIndication(data: CreateIndicationData): Promise<MemberIndication> {
    // Por enquanto, retornar dados mock até termos a tabela member_indications
    const mockIndication: MemberIndication = {
      id: crypto.randomUUID(),
      ...data,
      status: 'pendente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member: {
        id: data.member_id,
        full_name: 'Membro Indicado',
        email: 'membro@email.com'
      },
      course: {
        id: data.course_id,
        name: 'Curso de Teologia'
      }
    };
    
    console.log('Creating indication (mock):', mockIndication);
    return mockIndication;
  },

  async getIndicationsByPastor(pastorId: string): Promise<MemberIndication[]> {
    // Por enquanto, retornar dados mock
    const mockIndications: MemberIndication[] = [
      {
        id: '1',
        member_id: '1',
        course_id: '1',
        indicated_by: pastorId,
        justification: 'Membro dedicado com potencial para liderança',
        priority: 'alta',
        status: 'pendente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member: {
          id: '1',
          full_name: 'João Silva',
          email: 'joao@email.com'
        },
        course: {
          id: '1',
          name: 'Teologia Sistemática'
        }
      }
    ];
    
    return mockIndications;
  },

  async updateIndicationStatus(
    indicationId: string, 
    status: 'pendente' | 'aprovada' | 'rejeitada'
  ): Promise<void> {
    // Por enquanto, apenas log da atualização
    console.log('Updating indication status (mock):', indicationId, status);
  },

  async getPendingIndications(): Promise<MemberIndication[]> {
    // Por enquanto, retornar dados mock
    const mockIndications: MemberIndication[] = [
      {
        id: '1',
        member_id: '1',
        course_id: '1',
        indicated_by: '1',
        justification: 'Membro dedicado com potencial para liderança',
        priority: 'alta',
        status: 'pendente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member: {
          id: '1',
          full_name: 'João Silva',
          email: 'joao@email.com'
        },
        course: {
          id: '1',
          name: 'Teologia Sistemática'
        }
      }
    ];
    
    return mockIndications;
  },

  async getMembersForIndication(congregationId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        created_at
      `)
      .eq('congregation_id', congregationId)
      .in('role', ['membro'])
      .eq('status', 'ativo')
      .order('full_name');

    if (error) {
      console.log('Error fetching members, returning mock data:', error);
      // Fallback para dados mock
      return [
        {
          id: '1',
          full_name: 'João Silva',
          email: 'joao@email.com',
          role: 'membro',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          full_name: 'Maria Santos',
          email: 'maria@email.com',
          role: 'membro',
          created_at: new Date().toISOString()
        }
      ];
    }
    return data || [];
  }
};