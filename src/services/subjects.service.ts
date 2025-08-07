import { supabase } from "@/integrations/supabase/client";

export type Subject = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  credits?: number;
  course_id?: string;
  professor_id?: string;
  created_at: string;
  updated_at: string;
};

export type NovaSubject = Omit<Subject, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type AtualizarSubject = Partial<NovaSubject>;

export const subjectsService = {
  async listar() {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        courses (id, name)
      `)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async criar(subject: NovaSubject) {
    console.log('🔍 subjectsService.criar chamado com:', subject);
    
    // Check current user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Current user:', user);
    console.log('❌ User error:', userError);
    
    if (!user) {
      console.log('❌ Usuário não autenticado!');
      throw new Error('Usuário não autenticado');
    }
    
    // Check user profile and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .single();
    
    console.log('👤 User profile:', profile);
    console.log('❌ Profile error:', profileError);
    
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert(subject)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro detalhado ao criar disciplina:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Erro ao criar disciplina: ${error.message}`);
      }

      console.log('✅ Disciplina criada com sucesso:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Erro geral ao criar disciplina:', error);
      throw error;
    }
  },

  async atualizar(id: string, subject: AtualizarSubject) {
    const { data, error } = await supabase
      .from('subjects')
      .update(subject)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletar(id: string) {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        courses (id, name)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
};