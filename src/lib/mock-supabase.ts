// Mock service to handle Supabase calls during development
// This bypasses TypeScript errors when Supabase schema is not ready

import { toast } from 'sonner';

class MockSupabaseService {
  // Mock delay to simulate network calls
  private async mockDelay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async mockInsert(table: string, data: any) {
    await this.mockDelay();
    console.log(`[Mock Insert] ${table}:`, data);
    
    return {
      data: { id: Date.now().toString(), ...data },
      error: null
    };
  }

  async mockSelect(table: string, query?: any) {
    await this.mockDelay();
    console.log(`[Mock Select] ${table}:`, query);

    // Mock data based on table
    const mockData = this.getMockData(table);
    
    return {
      data: mockData,
      error: null
    };
  }

  async mockUpdate(table: string, data: any, id?: string) {
    await this.mockDelay();
    console.log(`[Mock Update] ${table}:`, data, 'ID:', id);
    
    return {
      data: { id: id || Date.now().toString(), ...data },
      error: null
    };
  }

  async mockDelete(table: string, id: string) {
    await this.mockDelay();
    console.log(`[Mock Delete] ${table} ID:`, id);
    
    return {
      data: null,
      error: null
    };
  }

  private getMockData(table: string) {
    switch (table) {
      case 'users':
        return [
          {
            id: '1',
            full_name: 'João Silva',
            email: 'joao@email.com',
            cpf: '123.456.789-00',
            phone: '(11) 99999-9999',
            birth_date: '1990-01-01',
            status: 'active',
            role: 'student'
          },
          {
            id: '2',
            full_name: 'Maria Santos',
            email: 'maria@email.com',
            cpf: '987.654.321-00',
            phone: '(11) 88888-8888', 
            birth_date: '1985-05-15',
            status: 'active',
            role: 'student'
          }
        ];

      case 'notifications':
        return [
          {
            id: '1',
            title: 'Bem-vindo ao Sistema',
            message: 'Sistema MIEADI funcionando corretamente',
            type: 'info',
            read: false,
            created_at: new Date().toISOString(),
            user_id: '1'
          }
        ];

      case 'assessments':
        return [
          {
            id: '1',
            title: 'Avaliação de Teologia',
            description: 'Primeira avaliação do semestre',
            class_id: '1',
            start_date: new Date().toISOString(),
            duration_minutes: 120,
            created_at: new Date().toISOString()
          }
        ];

      case 'profiles':
        return [
          {
            id: '1',
            full_name: 'Prof. Carlos Silva',
            email: 'carlos@mieadi.com',
            role: 'professor',
            bio: 'Professor de Teologia'
          }
        ];

      default:
        return [];
    }
  }

  // Handle successful operations with toast
  handleSuccess(operation: string, table: string) {
    const messages = {
      insert: `Registro criado com sucesso em ${table}!`,
      update: `Registro atualizado com sucesso em ${table}!`,
      delete: `Registro removido com sucesso de ${table}!`
    };
    
    toast.success(messages[operation as keyof typeof messages] || 'Operação realizada com sucesso!');
  }

  // Handle errors with toast
  handleError(operation: string, error: any) {
    console.error(`[Mock Error] ${operation}:`, error);
    toast.error(`Erro na operação: ${operation}`);
  }
}

export const mockSupabase = new MockSupabaseService();

// Helper functions to replace common Supabase patterns
export const mockSupabaseFrom = (table: string) => ({
  insert: (data: any) => mockSupabase.mockInsert(table, data),
  select: (query?: string) => mockSupabase.mockSelect(table, query),
  update: (data: any) => ({ eq: (field: string, value: any) => mockSupabase.mockUpdate(table, data, value) }),
  delete: () => ({ eq: (field: string, value: any) => mockSupabase.mockDelete(table, value) })
});