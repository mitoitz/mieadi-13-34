
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Edit, Save, Trash2, Upload, FileText } from 'lucide-react';
import { RetroactiveAttendanceManager } from './RetroactiveAttendanceManager';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  session_id: string;
  date: string;
  status: string;
  notes?: string;
  student: {
    full_name: string;
  };
  class: {
    name: string;
  };
}

interface Class {
  id: string;
  name: string;
}

export const AttendanceManager = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false);
  const [fileUploadMode, setFileUploadMode] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showRetroactiveManager, setShowRetroactiveManager] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAttendances();
    loadClasses();
  }, []);

  const loadAttendances = async () => {
    try {
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          *,
          student:profiles(full_name),
          class:classes(name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      // Filter out items with relation errors and ensure proper type
      const validData = (data || []).filter((item: any) => {
        return item?.student && 
               typeof item.student === 'object' && 
               item.student !== null && 
               'full_name' in item.student &&
               item?.class && 
               typeof item.class === 'object' && 
               item.class !== null && 
               'name' in item.class;
      });
      setAttendances(validData as unknown as Attendance[]);
    } catch (error) {
      console.error('Erro ao carregar frequências:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as frequências",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('status', 'ativa');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const updateBulkAttendances = async () => {
    if (!selectedDate || !selectedClass) {
      toast({
        title: "Erro",
        description: "Selecione uma data e uma turma",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('attendances')
        .update({
          date: formattedDate,
          class_id: selectedClass
        })
        .neq('id', '');

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Frequências atualizadas em lote",
      });

      loadAttendances();
      setBulkUpdateMode(false);
    } catch (error) {
      console.error('Erro ao atualizar frequências:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as frequências",
        variant: "destructive",
      });
    }
  };

  const deleteAttendance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('attendances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Frequência excluída",
      });

      loadAttendances();
    } catch (error) {
      console.error('Erro ao excluir frequência:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a frequência",
        variant: "destructive",
      });
    }
  };

  const processFileContent = async () => {
    if (!fileContent.trim()) {
      toast({
        title: "Erro",
        description: "Cole o conteúdo do arquivo TXT no campo abaixo",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('🚀 Iniciando processamento do arquivo TXT');
      console.log('📄 Conteúdo do arquivo (primeiros 500 chars):', fileContent.substring(0, 500));

      // Buscar estudantes e turmas existentes
      const { data: students } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'aluno')
        .limit(1);

      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('status', 'ativa')
        .limit(1);

      // Usar estudante e turma existentes ou o usuário atual
      const currentUser = (await supabase.auth.getUser()).data.user;
      let defaultStudentId = students?.[0]?.id || currentUser?.id;
      let defaultClassId = classes?.[0]?.id;

      // Se não há turma, não é possível prosseguir
      if (!defaultClassId) {
        throw new Error('❌ É necessário ter pelo menos uma turma ativa no sistema antes de importar frequências.');
      }

      // Se não há estudante, usar o usuário atual
      if (!defaultStudentId) {
        defaultStudentId = currentUser?.id;
        if (!defaultStudentId) {
          throw new Error('❌ É necessário estar logado para importar frequências.');
        }
      }

      // Processar o arquivo linha por linha
      const lines = fileContent.split('\n').filter(line => line.trim());
      const attendanceRecords = [];
      let processedLines = 0;

      console.log(`📊 Total de linhas: ${lines.length}`);

      for (const line of lines) {
        processedLines++;
        setUploadProgress((processedLines / lines.length) * 50);

        const trimmedLine = line.trim();
        
        // Pular linhas vazias ou comentários
        if (!trimmedLine || trimmedLine.startsWith('--') || trimmedLine.startsWith('/*')) {
          continue;
        }

        console.log(`🔍 Processando linha: ${trimmedLine}`);

        // Tentar diferentes formatos de parsing
        let data = null;

        // Formato 1: JSON simples
        if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
          try {
            data = JSON.parse(trimmedLine);
          } catch (e) {
            console.log('Não é JSON válido');
          }
        }

        // Formato 2: SQL INSERT
        if (!data && trimmedLine.toUpperCase().includes('INSERT')) {
          // Extrair valores de INSERT
          const valuesMatch = trimmedLine.match(/VALUES\s*\((.*)\)/i);
          if (valuesMatch) {
            const values = valuesMatch[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
            if (values.length >= 4) {
              data = {
                student_id: values[1] || defaultStudentId,
                class_id: values[2] || defaultClassId,
                date: values[4] || format(new Date(), 'yyyy-MM-dd'),
                status: values[5] || 'presente'
              };
            }
          }
        }

        // Formato 3: CSV ou separado por vírgulas/pipes
        if (!data && (trimmedLine.includes(',') || trimmedLine.includes('|'))) {
          const separator = trimmedLine.includes('|') ? '|' : ',';
          const values = trimmedLine.split(separator).map(v => v.trim().replace(/['"]/g, ''));
          
          if (values.length >= 2) {
            data = {
              student_id: defaultStudentId,
              class_id: defaultClassId,
              date: values[0]?.match(/\d{4}-\d{2}-\d{2}/) ? values[0] : format(new Date(), 'yyyy-MM-dd'),
              status: values[1]?.toLowerCase() === 'ausente' || values[1] === '0' ? 'ausente' : 'presente'
            };
          }
        }

        // Formato 4: Dados simples (uma palavra por linha)
        if (!data && trimmedLine.length > 0) {
          // Se a linha contém uma data válida
          if (trimmedLine.match(/\d{4}-\d{2}-\d{2}/)) {
            data = {
              student_id: defaultStudentId,
              class_id: defaultClassId,
              date: trimmedLine.match(/\d{4}-\d{2}-\d{2}/)[0],
              status: 'presente'
            };
          } else {
            // Linha genérica - criar frequência padrão
            data = {
              student_id: defaultStudentId,
              class_id: defaultClassId,
              date: format(new Date(), 'yyyy-MM-dd'),
              status: 'presente'
            };
          }
        }

        if (data) {
          // Validar e limpar dados
          const record = {
            id: crypto.randomUUID(),
            student_id: data.student_id || defaultStudentId,
            class_id: data.class_id || defaultClassId,
            session_id: data.session_id || null,
            date: data.date && data.date.match(/\d{4}-\d{2}-\d{2}/) ? data.date : format(new Date(), 'yyyy-MM-dd'),
            status: data.status === 'ausente' || data.status === '0' ? 'ausente' : 'presente',
            notes: data.notes || null
          };

          attendanceRecords.push(record);
          console.log(`✅ Registro criado:`, record);
        } else {
          console.log(`❌ Não foi possível processar a linha: ${trimmedLine}`);
        }
      }

      setUploadProgress(60);

      if (attendanceRecords.length === 0) {
        throw new Error('❌ Nenhum registro válido encontrado. Verifique o formato do arquivo.');
      }

      console.log(`📋 Total de registros para inserir: ${attendanceRecords.length}`);

      // Inserir em lotes menores
      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < attendanceRecords.length; i += batchSize) {
        const batch = attendanceRecords.slice(i, i + batchSize);
        
        try {
          const { error } = await supabase
            .from('attendances')
            .insert(batch);

          if (error) {
            console.error('Erro no lote:', error);
            errorCount += batch.length;
          } else {
            successCount += batch.length;
            console.log(`✅ Lote inserido: ${batch.length} registros`);
          }
        } catch (batchError) {
          console.error('Erro no lote (catch):', batchError);
          errorCount += batch.length;
        }

        setUploadProgress(60 + ((i + batchSize) / attendanceRecords.length) * 40);
        await new Promise(resolve => setTimeout(resolve, 100)); // Pausa pequena
      }

      setUploadProgress(100);

      const message = `${successCount} registros inseridos com sucesso` + 
        (errorCount > 0 ? `, ${errorCount} falharam` : '');

      console.log(`🎉 Resultado final: ${message}`);

      toast({
        title: successCount > 0 ? "Sucesso!" : "Erro",
        description: message,
        variant: successCount > 0 ? "default" : "destructive",
      });

      if (successCount > 0) {
        await loadAttendances();
      }

      setFileUploadMode(false);
      setFileContent('');
    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      toast({
        title: "Erro no processamento",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando frequências...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Gerenciar Frequências
            <div className="flex gap-2">
              <Button
                onClick={() => setShowRetroactiveManager(true)}
                variant="outline"
                className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Frequência Retroativa
              </Button>
              <Button
                onClick={() => setFileUploadMode(!fileUploadMode)}
                variant={fileUploadMode ? "destructive" : "outline"}
              >
                <Upload className="h-4 w-4 mr-2" />
                {fileUploadMode ? 'Cancelar Upload' : 'Upload TXT'}
              </Button>
              <Button
                onClick={() => setBulkUpdateMode(!bulkUpdateMode)}
                variant={bulkUpdateMode ? "destructive" : "outline"}
              >
                <Edit className="h-4 w-4 mr-2" />
                {bulkUpdateMode ? 'Cancelar' : 'Edição em Lote'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bulkUpdateMode && (
            <div className="bg-muted p-4 rounded-lg mb-6 space-y-4">
              <h3 className="font-semibold">Atualização em Lote</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nova Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Nova Turma</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classe) => (
                        <SelectItem key={classe.id} value={classe.id}>
                          {classe.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={updateBulkAttendances} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Atualizar Todas
                  </Button>
                </div>
              </div>
            </div>
          )}

          {fileUploadMode && (
            <div className="bg-muted p-4 rounded-lg mb-6 space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h3 className="font-semibold">Upload de Arquivo TXT</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Cole aqui o conteúdo do seu arquivo TXT. O sistema aceita vários formatos:
                JSON, SQL INSERT, CSV, ou dados simples separados por vírgula/pipe.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Conteúdo do Arquivo TXT</Label>
                  <Textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    placeholder="Cole aqui o conteúdo do arquivo... Exemplo:
2024-01-15,presente
2024-01-16,ausente
ou
INSERT INTO attendances VALUES (...)
ou qualquer formato de dados"
                    className="min-h-[200px] font-mono text-sm"
                    disabled={uploading}
                  />
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processando arquivo...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={processFileContent} 
                    disabled={uploading || !fileContent.trim()}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Processando...' : 'Processar Arquivo'}
                  </Button>
                  <Button
                    onClick={() => {
                      setFileUploadMode(false);
                      setFileContent('');
                      setUploadProgress(0);
                    }}
                    variant="outline"
                    disabled={uploading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">Frequências Cadastradas ({attendances.length})</h3>
            
            {attendances.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma frequência encontrada</p>
            ) : (
              <div className="grid gap-4">
                {attendances.map((attendance) => (
                  <Card key={attendance.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="font-medium">
                              {attendance.student?.full_name || 'Nome não informado'}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {attendance.class?.name || 'Turma não informada'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Data: {format(new Date(attendance.date), 'dd/MM/yyyy')}</span>
                            <span>Status: {attendance.status}</span>
                          </div>
                          {attendance.notes && (
                            <p className="text-sm text-muted-foreground">
                              Observações: {attendance.notes}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => deleteAttendance(attendance.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <RetroactiveAttendanceManager 
        open={showRetroactiveManager}
        onOpenChange={(open) => {
          setShowRetroactiveManager(open);
          if (!open) {
            loadAttendances(); // Recarregar após fechar
          }
        }}
      />
    </div>
  );
};
