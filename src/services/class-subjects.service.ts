import { supabase } from "@/integrations/supabase/client";

export type ClassSubject = {
  id: string;
  class_id: string;
  subject_id: string;
  order_index: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type NovaClassSubject = Omit<ClassSubject, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export const classSubjectsService = {
  async listarPorTurma(classId: string) {
    const { data, error } = await supabase
      .from('class_subjects')
      .select(`
        *,
        subjects (id, name, code, credits, description)
      `)
      .eq('class_id', classId)
      .order('order_index');
    
    if (error) throw error;
    return data;
  },

  async adicionar(classSubject: NovaClassSubject) {
    const { data, error } = await supabase
      .from('class_subjects')
      .insert(classSubject)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async remover(id: string) {
    const { error } = await supabase
      .from('class_subjects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async atualizar(id: string, updates: Partial<NovaClassSubject>) {
    const { data, error } = await supabase
      .from('class_subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async adicionarDisciplina(classId: string, subjectId: string, isPrimary: boolean = false) {
    // Buscar o próximo order_index
    const { data: existing } = await supabase
      .from('class_subjects')
      .select('order_index')
      .eq('class_id', classId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

    const { data, error } = await supabase
      .from('class_subjects')
      .insert({
        class_id: classId,
        subject_id: subjectId,
        order_index: nextOrderIndex,
        is_primary: isPrimary
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async adicionarMultiplasDisciplinas(classId: string, subjectIds: string[]) {
    // Verificar quais disciplinas já estão associadas
    const { data: existing } = await supabase
      .from('class_subjects')
      .select('subject_id')
      .eq('class_id', classId);

    const existingSubjectIds = existing?.map(cs => cs.subject_id) || [];
    const newSubjectIds = subjectIds.filter(id => !existingSubjectIds.includes(id));

    if (newSubjectIds.length === 0) {
      return [];
    }

    // Buscar o próximo order_index
    const { data: lastOrder } = await supabase
      .from('class_subjects')
      .select('order_index')
      .eq('class_id', classId)
      .order('order_index', { ascending: false })
      .limit(1);

    let nextOrderIndex = lastOrder && lastOrder.length > 0 ? lastOrder[0].order_index + 1 : 0;

    const inserts = newSubjectIds.map(subjectId => ({
      class_id: classId,
      subject_id: subjectId,
      order_index: nextOrderIndex++,
      is_primary: false
    }));

    const { data, error } = await supabase
      .from('class_subjects')
      .insert(inserts)
      .select();
    
    if (error) throw error;
    return data;
  },

  async removerDisciplina(classId: string, subjectId: string) {
    const { error } = await supabase
      .from('class_subjects')
      .delete()
      .eq('class_id', classId)
      .eq('subject_id', subjectId);
    
    if (error) throw error;
  },

  async removerTodasDisciplinas(classId: string) {
    const { error } = await supabase
      .from('class_subjects')
      .delete()
      .eq('class_id', classId);
    
    if (error) throw error;
  },

  async definirPrincipal(classId: string, subjectId: string) {
    // Primeiro remover flag principal de todas as disciplinas da turma
    await supabase
      .from('class_subjects')
      .update({ is_primary: false })
      .eq('class_id', classId);

    // Depois definir a nova principal
    const { data, error } = await supabase
      .from('class_subjects')
      .update({ is_primary: true })
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};