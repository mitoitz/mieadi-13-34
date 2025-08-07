
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, User, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { enrollmentService } from "@/services/matriculas.service";
import { useEnrollmentData } from "@/hooks/useEnrollmentData";
import { useQueryClient } from "@tanstack/react-query";

interface Student {
  id: string;
  full_name: string;
  email: string;
  cpf?: string;
}

interface Class {
  id: string;
  name: string;
}

interface Course {
  id: string;
  name: string;
}

interface CreateMatriculaDialogProps {
  onSuccess: () => void;
}

export function CreateMatriculaDialog({ onSuccess }: CreateMatriculaDialogProps) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  
  // Data hook
  const { students, classes, courses, loading, loadData } = useEnrollmentData();
  
  // Form data
  const [formData, setFormData] = useState({
    student_id: "",
    class_id: "",
    course_id: "",
    status: "ativa" as const
  });


  useEffect(() => {
    if (showDialog) {
      loadData();
    }
  }, [showDialog, loadData]);

  const handleCreate = async () => {
    if (!formData.student_id || !formData.class_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setPendingData(formData);
    executeCreateMatricula();
  };

  const executeCreateMatricula = async () => {
    if (!pendingData) return;

    try {
      await enrollmentService.enrollStudent(
        pendingData.student_id,
        pendingData.class_id,
        pendingData.course_id
      );
      toast.success("Matrícula criada com sucesso!");
      setShowDialog(false);
      setFormData({ student_id: "", class_id: "", course_id: "", status: "ativa" });
      setPendingData(null);
      // Invalidar cache das turmas para atualizar contagem
      queryClient.invalidateQueries({ queryKey: ['turmas'] });
      onSuccess();
    } catch (error) {
      console.error('Error creating enrollment:', error);
      toast.error("Erro ao criar matrícula");
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Matrícula
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Nova Matrícula Individual
          </DialogTitle>
          <DialogDescription>
            Matricule um aluno em uma turma específica
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="student_id">Selecionar Aluno</Label>
              <Select value={formData.student_id} onValueChange={(value) => setFormData({ ...formData, student_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{student.full_name}</div>
                          <div className="text-sm text-muted-foreground">{student.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="class_id">Selecionar Turma</Label>
              <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {cls.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="course_id">Selecionar Curso</Label>
              <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {course.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCreate} className="w-full" disabled={!formData.student_id || !formData.class_id}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Matrícula
            </Button>
          </div>
        )}
      </DialogContent>

    </Dialog>
  );
}
