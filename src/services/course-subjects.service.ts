import { supabase } from "@/integrations/supabase/client";

export type CourseSubject = {
  id: string;
  course_id: string;
  subject_id: string;
  order_index: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  course?: { id: string; name: string };
  subject?: { id: string; name: string; code?: string; credits?: number };
};

export type NovaCourseSubject = Omit<CourseSubject, 'id' | 'created_at' | 'updated_at' | 'course' | 'subject'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export const courseSubjectsService = {
  async listar() {
    const { data, error } = await supabase
      .from('course_subjects')
      .select(`
        *,
        course:courses (id, name),
        subject:subjects (id, name, code, credits)
      `)
      .order('course_id')
      .order('order_index');
    
    if (error) throw error;
    return data;
  },

  async listarPorCurso(courseId: string) {
    const { data, error } = await supabase
      .from('course_subjects')
      .select(`
        *,
        subject:subjects (id, name, code, credits, description)
      `)
      .eq('course_id', courseId)
      .order('order_index');
    
    if (error) throw error;
    return data;
  },

  async listarPorDisciplina(subjectId: string) {
    const { data, error } = await supabase
      .from('course_subjects')
      .select(`
        *,
        course:courses (id, name, description)
      `)
      .eq('subject_id', subjectId)
      .order('course_id');
    
    if (error) throw error;
    return data;
  },

  async adicionarDisciplinaAoCurso(courseSubject: NovaCourseSubject) {
    const { data, error } = await supabase
      .from('course_subjects')
      .insert(courseSubject)
      .select(`
        *,
        course:courses (id, name),
        subject:subjects (id, name, code, credits)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async removerDisciplinaDoCurso(courseId: string, subjectId: string) {
    const { error } = await supabase
      .from('course_subjects')
      .delete()
      .eq('course_id', courseId)
      .eq('subject_id', subjectId);
    
    if (error) throw error;
  },

  async atualizarOrdem(id: string, newOrder: number) {
    const { data, error } = await supabase
      .from('course_subjects')
      .update({ order_index: newOrder })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async alternarObrigatoria(id: string, isRequired: boolean) {
    const { data, error } = await supabase
      .from('course_subjects')
      .update({ is_required: isRequired })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Buscar disciplinas disponíveis que ainda não estão no curso
  async buscarDisciplinasDisponiveis(courseId: string) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .not('id', 'in', `(
        SELECT subject_id 
        FROM course_subjects 
        WHERE course_id = '${courseId}'
      )`)
      .order('name');
    
    if (error) throw error;
    return data;
  }
};