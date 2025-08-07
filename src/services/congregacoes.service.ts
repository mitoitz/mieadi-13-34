import { supabase } from '@/integrations/supabase/client';

export interface Congregacao {
  id?: string;
  name: string;
  pastor_name?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NovaCongregarao extends Omit<Congregacao, 'id' | 'created_at' | 'updated_at'> {}

export const congregacoesService = {
  async listar() {
    const { data, error } = await supabase
      .from('congregations')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('congregations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async criar(congregacao: Omit<Congregacao, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('congregations')
      .insert(congregacao)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async atualizar(id: string, updates: Partial<Congregacao>) {
    const { data, error } = await supabase
      .from('congregations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletar(id: string) {
    const { error } = await supabase
      .from('congregations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};