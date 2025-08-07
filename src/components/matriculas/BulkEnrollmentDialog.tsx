import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, BookOpen, UserPlus, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { enrollmentService } from "@/services/matriculas.service";
import { useEnrollmentData } from "@/hooks/useEnrollmentData";
import { useQueryClient } from "@tanstack/react-query";

interface Student {
  id: string;
  full_name: string;
  email: string;
  cpf?: string;
  status: string;
}

interface Class {
  id: string;
  name: string;
  status: string;
}

interface Course {
  id: string;
  name: string;
}

interface BulkEnrollmentDialogProps {
  onSuccess: () => void;
}

export function BulkEnrollmentDialog({ onSuccess }: BulkEnrollmentDialogProps) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  
  // Selected data
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  
  // Data hook
  const { students, classes, courses, loading, loadData } = useEnrollmentData();
  

  useEffect(() => {
    if (showDialog) {
      loadData();
    }
  }, [showDialog, loadData]);

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.cpf?.includes(searchTerm)
  );

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedStudents.length === 0) {
      toast.error("Selecione pelo menos um aluno");
      return;
    }
    if (step === 2 && (!selectedClass || !selectedCourse)) {
      toast.error("Selecione a turma e o curso");
      return;
    }
    setStep(step + 1);
  };

  const handleEnroll = () => {
    executeEnrollment();
  };

  const executeEnrollment = async () => {
    setEnrollmentLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const studentId of selectedStudents) {
        try {
          await enrollmentService.enrollStudent(studentId, selectedClass, selectedCourse);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error enrolling student ${studentId}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} alunos matriculados com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} matrículas falharam`);
      }

      if (successCount > 0) {
        setShowDialog(false);
        resetForm();
        // Invalidar cache das turmas para atualizar contagem
        queryClient.invalidateQueries({ queryKey: ['turmas'] });
        onSuccess();
      }
    } catch (error) {
      console.error('Error in bulk enrollment:', error);
      toast.error("Erro na matrícula em lote");
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedStudents([]);
    setSelectedClass("");
    setSelectedCourse("");
    setSearchTerm("");
  };

  const selectedClass_ = classes.find(c => c.id === selectedClass);
  const selectedCourse_ = courses.find(c => c.id === selectedCourse);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" variant="outline">
          <Users className="h-4 w-4" />
          Matrícula em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Matrícula em Lote de Alunos
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Selecione os alunos que deseja matricular"}
            {step === 2 && "Escolha a turma e o curso para a matrícula"}
            {step === 3 && "Confirme os dados da matrícula em lote"}
          </DialogDescription>
        </DialogHeader>

        {(loading || enrollmentLoading) && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          </div>
        )}

        {!loading && !enrollmentLoading && step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar alunos por nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={handleSelectAll}
                disabled={filteredStudents.length === 0}
              >
                {selectedStudents.length === filteredStudents.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              {selectedStudents.length} de {filteredStudents.length} alunos selecionados
            </div>

            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => handleStudentToggle(student.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {student.status}
                            </Badge>
                            {student.cpf && (
                              <span className="text-xs text-muted-foreground">
                                CPF: {student.cpf}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end">
              <Button onClick={handleNext} disabled={selectedStudents.length === 0}>
                Próximo ({selectedStudents.length} selecionados)
              </Button>
            </div>
          </div>
        )}

        {!loading && !enrollmentLoading && step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados da Matrícula</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="class-select">Selecionar Turma</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes
                        .filter(cls => cls.status === 'ativa')
                        .map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="course-select">Selecionar Curso</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={handleNext} disabled={!selectedClass || !selectedCourse}>
                Próximo
              </Button>
            </div>
          </div>
        )}

        {!loading && !enrollmentLoading && step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Confirmar Matrícula em Lote
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Turma Selecionada</Label>
                    <p className="text-lg">{selectedClass_?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Curso Selecionado</Label>
                    <p className="text-lg">{selectedCourse_?.name}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">
                    Alunos a serem matriculados ({selectedStudents.length})
                  </Label>
                  <ScrollArea className="h-32 mt-2">
                    <div className="space-y-2">
                      {selectedStudents.map((studentId) => {
                        const student = students.find(s => s.id === studentId);
                        return (
                          <div key={studentId} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{student?.full_name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button 
                onClick={handleEnroll} 
                className="bg-green-600 hover:bg-green-700"
                disabled={enrollmentLoading}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {enrollmentLoading ? "Matriculando..." : "Confirmar Matrículas"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

    </Dialog>
  );
}