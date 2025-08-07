import { supabase } from "@/integrations/supabase/client";

export type Campo = {
  id: string;
  name: string;
  description: string | null;
  responsible_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { id: string; full_name: string } | null;
};

export type NovoCampo = Omit<Campo, 'id' | 'created_at' | 'updated_at' | 'profiles'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type AtualizarCampo = Partial<NovoCampo>;

export const camposService = {
  async listar() {
    const { data, error } = await supabase
      .from('fields')
      .select(`
        *,
        profiles:responsible_id (
          id,
          full_name
        )
      `)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async criar(campo: NovoCampo) {
    const { data, error } = await supabase
      .from('fields')
      .insert(campo)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async atualizar(id: string, campo: AtualizarCampo) {
    const { data, error } = await supabase
      .from('fields')
      .update(campo)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletar(id: string) {
    const { error } = await supabase
      .from('fields')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('fields')
      .select(`
        *,
        profiles:responsible_id (
          id,
          full_name
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
};