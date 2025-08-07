import { supabase } from "@/integrations/supabase/client";

export type Course = {
  id: string;
  name: string;
  description?: string;
  duration_months?: number;
  total_credits?: number;
  created_at: string;
  updated_at: string;
};

export type NovoCourse = Omit<Course, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type AtualizarCourse = Partial<NovoCourse>;

export const coursesService = {
  async listar() {
    console.log('🔄 Executando query para listar cursos...');
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Erro no coursesService.listar:', error);
      throw error;
    }
    console.log('✅ Cursos encontrados:', data?.length || 0);
    return data;
  },

  async criar(course: NovoCourse) {
    console.log('🔄 Executando query para criar curso:', course);
    const { data, error } = await supabase
      .from('courses')
      .insert(course)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('❌ Erro no coursesService.criar:', error);
      throw error;
    }
    console.log('✅ Curso criado com sucesso:', data);
    return data;
  },

  async atualizar(id: string, course: AtualizarCourse) {
    const { data, error } = await supabase
      .from('courses')
      .update(course)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async deletar(id: string) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
};