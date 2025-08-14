
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
    console.log('🔥 Iniciando processamento do arquivo');
    
    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);
    let successCount = 0;
    let errorCount = 0;
    let totalLines = lines.length;
    
    console.log(`📊 Total de linhas para processar: ${totalLines}`);

    // Parse all lines first
    const parsedRecords: any[] = [];
    
    for (const line of lines) {
      console.log(`🔍 Processando linha: ${line}`);
      
      try {
        let parsedData: any = null;

        // Try different parsing strategies
        if (line.startsWith('{') && line.endsWith('}')) {
          // JSON format
          parsedData = JSON.parse(line);
        } else if (line.includes('INSERT INTO') || line.includes('VALUES')) {
          // Skip SQL structure lines
          if (line.includes('INSERT INTO') || line.includes('VALUES')) {
            continue;
          }
        } else if (line.includes('(') && line.includes(')')) {
          // Parse SQL VALUES format like ('uuid1', 'uuid2', 'status', 'method', 'timestamp')
          const match = line.match(/\((.*?)\)/);
          if (match) {
            const values = match[1].split(',').map(v => v.trim().replace(/'/g, ''));
            if (values.length >= 3) {
              parsedData = {
                student_id: values[0],
                class_id: values[1] !== 'null' ? values[1] : (classes.length > 0 ? classes[0].id : null),
                status: values[2] || 'presente',
                notes: values.length > 3 ? values.slice(3).join(' ') : null
              };
            }
          }
        } else if (line.includes(',')) {
          // CSV format
          const values = line.split(',').map(v => v.trim());
          if (values.length >= 2) {
            parsedData = {
              student_id: values[0],
              class_id: values[1] || (classes.length > 0 ? classes[0].id : null),
              status: values[2] || 'presente'
            };
          }
        } else {
          // Simple format - just student_id
          parsedData = {
            student_id: line,
            status: 'presente'
          };
        }

        if (!parsedData || !parsedData.student_id) {
          console.log(`⚠️ Dados inválidos na linha: ${line}`);
          continue;
        }

        // Create attendance record with default values
        const attendanceData = {
          student_id: parsedData.student_id,
          class_id: parsedData.class_id || (classes.length > 0 ? classes[0].id : null),
          session_id: parsedData.session_id || null,
          date: parsedData.date || new Date().toISOString().split('T')[0],
          status: parsedData.status || 'presente',
          notes: parsedData.notes || null
        };

        parsedRecords.push(attendanceData);
      } catch (error) {
        console.error(`❌ Erro ao processar linha "${line}":`, error);
        errorCount++;
      }
    }

    if (parsedRecords.length === 0) {
      toast({
        title: "Erro no Upload",
        description: "Nenhum registro válido encontrado no arquivo.",
        variant: "destructive"
      });
      setUploading(false);
      return;
    }

    console.log(`📦 Total de registros válidos: ${parsedRecords.length}`);

    // Use bulk insert RPC to bypass RLS
    try {
      const { data, error } = await supabase.rpc('bulk_insert_attendances', {
        records: parsedRecords
      });

      if (error) {
        console.error(`❌ Erro na inserção em lote:`, error);
        toast({
          title: "Erro no Upload",
          description: `Erro ao inserir registros: ${error.message}`,
          variant: "destructive"
        });
        errorCount = parsedRecords.length;
      } else {
        successCount = data?.length || 0;
        console.log(`✅ ${successCount} registros inseridos com sucesso`);
      }
    } catch (error) {
      console.error(`❌ Erro na inserção em lote:`, error);
      toast({
        title: "Erro no Upload", 
        description: `Erro ao processar arquivo: ${error}`,
        variant: "destructive"
      });
      errorCount = parsedRecords.length;
    }

    console.log(`🎉 Resultado final: ${successCount} registros inseridos com sucesso, ${errorCount} falharam`);
    
    toast({
      title: "Upload Concluído",
      description: `${successCount} registros inseridos com sucesso. ${errorCount} falharam.`,
      variant: successCount > 0 ? "default" : "destructive"
    });

    setUploading(false);
    setUploadProgress(100);
    
    if (successCount > 0) {
      loadAttendances();
      setFileUploadMode(false);
      setFileContent('');
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
