import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User, Check, X, AlertCircle } from "lucide-react";
import { feedback } from "@/components/ui/feedback";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AttendanceControlActionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Student {
  id: string;
  name: string;
  status?: 'presente' | 'ausente' | 'atrasado';
}

interface ClassData {
  id: string;
  name: string;
}

export function AttendanceControlAction({ isOpen, onClose, onSuccess }: AttendanceControlActionProps) {
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const { toast } = useToast();

  // Carregar turmas ativas do banco
  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  // Carregar alunos quando uma turma é selecionada
  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('status', 'ativa')
        .order('name');

      if (error) throw error;

      setClasses(data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      toast({
        title: "Erro ao carregar turmas",
        description: "Não foi possível carregar as turmas disponíveis.",
        variant: "destructive"
      });
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadStudents = async () => {
    if (!selectedClass) return;
    
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          profiles!enrollments_student_id_fkey (
            id,
            full_name
          )
        `)
        .eq('class_id', selectedClass)
        .eq('status', 'ativa');

      if (error) throw error;

      const formattedStudents: Student[] = (data || []).map(enrollment => ({
        id: enrollment.student_id,
        name: (enrollment as any).profiles?.full_name || 'Nome não encontrado'
      }));

      setStudents(formattedStudents);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      toast({
        title: "Erro ao carregar alunos",
        description: "Não foi possível carregar a lista de alunos.",
        variant: "destructive"
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'presente' | 'ausente' | 'atrasado') => {
    setStudents(prev => prev.map(student => 
      student.id === studentId ? { ...student, status } : student
    ));
  };

  const handleSubmit = async () => {
    if (!selectedClass) {
      feedback.warning("Selecione uma turma");
      return;
    }

    const studentsWithStatus = students.filter(s => s.status);
    if (studentsWithStatus.length === 0) {
      feedback.warning("Marque a presença de pelo menos um aluno");
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Preparar registros de presença
      const attendanceRecords = studentsWithStatus.map(student => ({
        student_id: student.id,
        class_id: selectedClass,
        date: today,
        status: student.status === 'presente' ? 'presente' : 
               student.status === 'atrasado' ? 'presente' : 'ausente',
        notes: student.status === 'atrasado' ? 'Chegou atrasado' : undefined,
        verification_method: 'manual'
      }));

      // Salvar no banco de dados
      const { error } = await supabase
        .from('attendances')
        .upsert(attendanceRecords, {
          onConflict: 'student_id,class_id,date'
        });

      if (error) throw error;

      feedback.success("Presença registrada com sucesso!");
      onSuccess();
    } catch (error) {
      console.error('Erro ao registrar presença:', error);
      feedback.error("Erro ao registrar presença");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedClass("");
    setStudents([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'presente': return <Check className="h-4 w-4 text-green-600" />;
      case 'ausente': return <X className="h-4 w-4 text-red-600" />;
      case 'atrasado': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'presente': return 'bg-green-100 text-green-800';
      case 'ausente': return 'bg-red-100 text-red-800';
      case 'atrasado': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Controle de Presença
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Turma</label>
            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loadingClasses}>
              <SelectTrigger>
                <SelectValue placeholder={loadingClasses ? "Carregando turmas..." : "Selecione a turma"} />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && (
            <div>
              <h3 className="text-sm font-medium mb-3">Lista de Alunos</h3>
              {loadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Carregando alunos...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {students.map((student) => (
                    <Card key={student.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(student.status)}
                            <span className="font-medium">{student.name}</span>
                            {student.status && (
                              <Badge className={getStatusColor(student.status)}>
                                {student.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={student.status === 'presente' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange(student.id, 'presente')}
                            >
                              Presente
                            </Button>
                            <Button
                              size="sm"
                              variant={student.status === 'atrasado' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange(student.id, 'atrasado')}
                            >
                              Atrasado
                            </Button>
                            <Button
                              size="sm"
                              variant={student.status === 'ausente' ? 'destructive' : 'outline'}
                              onClick={() => handleStatusChange(student.id, 'ausente')}
                            >
                              Ausente
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || loadingStudents} className="flex-1">
              {loading ? "Registrando..." : "Registrar Presença"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}