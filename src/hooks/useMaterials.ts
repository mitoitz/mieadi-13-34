import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClassMaterial {
  id: string;
  class_id: string | null;
  uploaded_by: string | null;
  title: string;
  description?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  // Campos adicionais da migração
  teacher_id?: string | null;
  material_type?: string | null;
}

export function useClassMaterials(classId?: string) {
  return useQuery<ClassMaterial[]>({
    queryKey: ['materials', 'class', classId],
    queryFn: async () => {
      if (!classId) return [];
      
      try {
        // Tentar buscar dados reais primeiro
        const { data, error } = await supabase
          .from('class_materials')
          .select('*')
          .eq('class_id', classId)
          .order('created_at', { ascending: false });

        if (error) {
          console.log('Fallback para dados mock - tabela em desenvolvimento', error);
          // Fallback para dados mock
          const mockMaterials: ClassMaterial[] = [
            {
              id: '1',
              class_id: classId,
              uploaded_by: '1',
              teacher_id: '1',
              title: 'Apostila de Teologia Sistemática',
              description: 'Material base para o curso',
              file_url: '/materials/teologia-sistematica.pdf',
              file_type: 'application/pdf',
              file_size: 2048000,
              material_type: 'documento',
              is_public: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              class_id: classId,
              uploaded_by: '1',
              teacher_id: '1',
              title: 'Slides - Introdução à Teologia',
              description: 'Apresentação das aulas',
              file_url: '/materials/slides-introducao.pptx',
              file_type: 'application/vnd.ms-powerpoint',
              file_size: 1024000,
              material_type: 'documento',
              is_public: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '3',
              class_id: classId,
              uploaded_by: '1',
              teacher_id: '1',
              title: 'Vídeo Aula - Aula 1',
              description: 'Introdução aos conceitos básicos',
              file_url: 'https://example.com/video-aula-1',
              file_type: 'video/mp4',
              file_size: 25600000,
              material_type: 'video',
              is_public: true,
              created_at: new Date(Date.now() - 86400000).toISOString(),
              updated_at: new Date(Date.now() - 86400000).toISOString()
            }
          ];
          return mockMaterials;
        }

        return (data as ClassMaterial[]) || [];
      } catch (error) {
        console.error('Error fetching materials:', error);
        return [];
      }
    },
    enabled: !!classId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useUploadMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      file, 
      materialData, 
      classId 
    }: { 
      file: File; 
      materialData: Omit<ClassMaterial, 'id' | 'file_url' | 'file_size' | 'created_at' | 'updated_at'>; 
      classId: string; 
    }) => {
      // Upload do arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${materialData.teacher_id}/${classId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL público do arquivo
      const { data: urlData } = supabase.storage
        .from('materials')
        .getPublicUrl(fileName);

      // Salvar dados do material
      const { data, error } = await supabase
        .from('class_materials')
        .insert({
          ...materialData,
          class_id: classId,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material enviado com sucesso!');
    },
    onError: (error) => {
      console.error('Error uploading material:', error);
      toast.error('Erro ao enviar material');
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ materialId, filePath }: { materialId: string; filePath?: string }) => {
      // Deletar arquivo do storage se existir
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('materials')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('Erro ao remover arquivo do storage:', storageError);
        }
      }

      // Deletar registro do material
      const { error } = await supabase
        .from('class_materials')
        .delete()
        .eq('id', materialId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material removido com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting material:', error);
      toast.error('Erro ao remover material');
    },
  });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, path }: { file: File; path: string }) => {
      const { data, error } = await supabase.storage
        .from('materials')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('materials')
        .getPublicUrl(path);

      return { path: data.path, publicUrl };
    },
    onError: (error) => {
      console.error('Error uploading file:', error);
      toast.error('Erro ao fazer upload do arquivo');
    },
  });
}