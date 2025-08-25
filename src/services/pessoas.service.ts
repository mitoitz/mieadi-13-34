import { supabase } from '@/integrations/supabase/client';
import { setUserContext } from '@/lib/auth-context';

class PessoasService {
  // Adicionar headers de autenticação se disponível
  static async getAuthHeaders() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        // Verificar se o token está válido
        console.log('🔑 Token disponível:', session.access_token.substring(0, 20) + '...');
        localStorage.setItem('supabase_token', session.access_token);
        return {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        };
      } else {
        console.warn('⚠️ Nenhum token de acesso disponível');
        localStorage.removeItem('supabase_token');
        return {
          'Content-Type': 'application/json'
        };
      }
    } catch (error) {
      console.error('❌ Erro ao obter headers de auth:', error);
      return {
        'Content-Type': 'application/json'
      };
    }
  }
}

export interface NovaPessoa {
  id?: string;
  full_name: string;
  email?: string;
  cpf?: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  photo_url?: string;
  bio?: string;
  status?: 'ativo' | 'inativo' | 'pendente';
  role: 'admin' | 'professor' | 'aluno' | 'pastor' | 'coordenador' | 'secretario' | 'membro';
  congregation_id?: string;
  field_id?: string;
  course_id?: string;
  ministerial_position?: string;
  spouse_name?: string;
  gender?: string;
  father_name?: string;
  mother_name?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  civil_status?: string;
  profession?: string;
  education_level?: string;
}

export const pessoasService = {
  async listar() {
    console.log('🔍 Iniciando busca de pessoas...');
    
    try {
      // Verificar token antes de fazer requisição
      const headers = await PessoasService.getAuthHeaders();
      console.log('🔐 Headers preparados:', Object.keys(headers));
      
      // Usar função get_all_people para buscar todas as pessoas sem limite
      const { data, error } = await supabase
        .rpc('get_all_people');

      if (error) {
        console.error('❌ Erro na query Supabase:', error);
        throw error;
      }
      
      console.log('✅ Dados retornados do Supabase:', data?.length || 0, 'pessoas');
      return data;
    } catch (error) {
      console.error('❌ Erro no serviço pessoas:', error);
      throw error;
    }
  },

  async listarPaginado(page: number = 0, limit: number = 100, searchTerm: string = '') {
    console.log('🔍 Buscando pessoas paginadas - Página:', page, 'Limite:', limit, 'Busca:', searchTerm);
    
    try {
      // Verificar token antes de fazer requisição
      const headers = await PessoasService.getAuthHeaders();
      console.log('🔐 Headers preparados para paginação:', Object.keys(headers));
      
      const offset = page * limit;
      const { data, error } = await supabase
        .rpc('get_people_paginated', { 
          page_offset: offset, 
          page_limit: limit, 
          search_term: searchTerm 
        });

      if (error) {
        console.error('❌ Erro na query paginada:', error);
        throw error;
      }
      
      const totalCount = data && data.length > 0 ? data[0].total_count : 0;
      const items = data || [];
      
      console.log('✅ Página carregada:', items.length, 'de', totalCount, 'total');
      
      return {
        items,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: (page + 1) * limit < totalCount,
        hasPrevPage: page > 0
      };
    } catch (error) {
      console.error('❌ Erro no serviço pessoas paginado:', error);
      throw error;
    }
  },

  async buscar(searchTerm: string) {
    console.log('🔍 Buscando pessoas com termo:', searchTerm);
    
    try {
      const { data, error } = await supabase
        .rpc('search_people', { search_term: searchTerm });

      if (error) throw error;
      
      console.log('✅ Pessoas encontradas:', data?.length || 0);
      return data;
    } catch (error) {
      console.error('❌ Erro na busca de pessoas:', error);
      throw error;
    }
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        congregations (name),
        fields (name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async buscarPastores() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'pastor')
      .order('full_name');

    if (error) throw error;
    return data;
  },

  async criar(pessoa: Omit<NovaPessoa, 'id'>) {
    console.log('🔄 Criando pessoa:', pessoa);
    
    try {
      // Configurar contexto de autenticação
      await setUserContext();
      
      // Remove campos que não existem na tabela profiles
      const { password, ...profileData } = pessoa as any;
      
      // Garantir que o ID seja gerado automaticamente se não fornecido
      const dataToInsert = {
        ...profileData,
        id: profileData.id || undefined, // Deixar que o Supabase gere se não fornecido
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📤 Dados para inserção:', dataToInsert);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro na inserção:', error);
        throw error;
      }
      
      console.log('✅ Pessoa criada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no serviço de criação:', error);
      throw error;
    }
  },

  async atualizar(id: string, updates: Partial<NovaPessoa>) {
    console.log('🔄 Atualizando pessoa:', id, updates);
    
    try {
      // Configurar contexto de autenticação
      await setUserContext();
      
      // Verificar sessão atual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Usuário atual:', user?.id, user?.email);
      
      if (authError) {
        console.error('❌ Erro de autenticação:', authError);
        throw new Error('Falha na autenticação');
      }
      
      if (!user) {
        console.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      // Remove campos que não existem na tabela profiles
      const { password, ...profileUpdates } = updates as any;
      
      // Adicionar timestamp de atualização
      const dataToUpdate = {
        ...profileUpdates,
        updated_at: new Date().toISOString()
      };
      
      console.log('📤 Dados para atualização:', dataToUpdate);
      console.log('🆔 ID do registro a ser atualizado:', id);
      
      // Primeiro verificar se o registro existe e se o usuário pode vê-lo
      const { data: existingData, error: selectError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', id)
        .single();
      
      if (selectError) {
        console.error('❌ Erro ao verificar registro existente:', selectError);
        throw new Error(`Erro ao localizar registro: ${selectError.message}`);
      }
      
      console.log('📋 Registro existente encontrado:', existingData);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro na atualização:', error);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ Detalhes do erro:', error.details);
        console.error('❌ Hint do erro:', error.hint);
        throw new Error(`Falha na atualização: ${error.message}`);
      }
      
      console.log('✅ Pessoa atualizada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no serviço de atualização:', error);
      throw error;
    }
  },

  async deletar(id: string) {
    console.log('🔄 Deletando pessoa:', id);
    
    try {
      // Configurar contexto de autenticação
      await setUserContext();
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro na exclusão:', error);
        throw error;
      }
      
      console.log('✅ Pessoa deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro no serviço de exclusão:', error);
      throw error;
    }
  },

  async buscarPorCPF(cpf: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('cpf', cpf)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};