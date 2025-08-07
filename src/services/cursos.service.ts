import { supabase } from '@/integrations/supabase/client';

export interface Curso {
  id?: string;
  name: string;
  description?: string;
  duration_months?: number;
  total_credits?: number;
  created_at?: string;
  updated_at?: string;
}

export interface NovoCurso {
  name: string;
  description?: string;
  duration_months?: number;
  total_credits?: number;
}

export const cursosService = {
  async listar() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  async criar(curso: Omit<Curso, 'id' | 'created_at' | 'updated_at'>) {
    console.log('🔄 Criando curso:', curso);
    
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert(curso)
        .select();

      console.log('📊 Resultado da criação:', { data, error });

      if (error) {
        console.error('❌ Erro detalhado ao criar curso:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Erro ao criar curso: ${error.message}`);
      }
      
      return data?.[0] || null;
    } catch (error: any) {
      console.error('❌ Erro geral ao criar curso:', error);
      throw error;
    }
  },

  async atualizar(id: string, updates: Partial<Curso>) {
    console.log('🔄 Atualizando curso:', { id, updates });
    
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select();
    
    console.log('📊 Resultado da atualização:', { data, error });
    
    if (error) throw error;
    return data?.[0] || null;
  },

  async deletar(id: string) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};